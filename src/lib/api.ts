// データアクセス層。UI はこのファイルの関数だけを呼ぶ。
// Supabase / Python RAG API への接続時は各関数の中身だけを差し替える（TODO コメント参照）。
import { delPdf, getPdf, load, putPdf, save } from "./store";
import type { CitationCheck, Doc, GraphEdge, Highlight, SearchHit } from "./types";

// --- 擬似 Embedding（モック）: 日英の簡易辞書 + 単語重なり。本番は bge-m3 のベクトル類似度 ---
const dict: Record<string, string> = {
  注意: "attention", 表現: "representation", 深層: "deep", 深い: "deep deeper", 学習: "learning", ネットワーク: "network networks", 防: "prevent reduces", 自動: "adaptive", 残差: "residual",
  過学習: "overfitting regularization dropout", 正則化: "regularization regularizer", 最適化: "optimization", 学習率: "learning rates",
  画像: "image images", 単語: "words", 列: "sequences", 生成: "generative generation", 敵対: "adversarial", 識別: "discriminative",
  事前学習: "pre-train pre-trained", 言語: "language", 翻訳: "translation", 正規化: "normalization", 勾配: "gradient",
  並列: "parallelizable", 分類: "classification classify", 層: "layer layers", 調整: "adaptive", 高速: "faster fast", 精度: "accuracy error",
};
export const tokens = (s: string) => {
  let t = s.toLowerCase();
  for (const [ja, en] of Object.entries(dict)) if (t.includes(ja)) t += ` ${en} ${ja}`;
  return new Set(t.match(/[a-z0-9]{3,}|[぀-鿿]{2,}/g) ?? []);
};
export const sim = (q: Set<string>, text: string) => {
  const t = tokens(text);
  const hit = [...q].filter((w) => [...t].some((x) => x.startsWith(w) || w.startsWith(x))).length;
  return q.size ? hit / q.size : 0;
};

const byNew = (a: Doc, b: Doc) => b.created_at.localeCompare(a.created_at);

export const listDocuments = async () => [...(await load()).docs].sort(byNew);
// TODO: supabase.from("documents").select("*").order("created_at", { ascending: false })

export async function getDocument(id: string) {
  const s = await load();
  return { doc: s.docs.find((d) => d.id === id), chunks: s.chunks.filter((c) => c.document_id === id), highlights: [] as Highlight[] };
}
// TODO: documents / chunks / highlights を document_id で取得

// PDF を保存して本文を chunk に分割（既存の文献に PDF を付ける場合は書誌情報を保つ）
async function ingest(doc: Doc, file: Blob) {
  const { analyzePdf } = await import("./pdf");
  const a = await analyzePdf(file).catch(() => null);
  const s = await load();
  await putPdf(doc.id, file);
  s.chunks = s.chunks.filter((c) => c.document_id !== doc.id).concat(
    (a?.chunks ?? []).map((c, i) => ({ id: `${doc.id}-c${i}`, document_id: doc.id, section: `${c.page} ページ`, ...c })),
  );
  Object.assign(doc, { has_pdf: true, status: a ? "indexed" : "error", pages: a?.pages ?? doc.pages });
  return a;
}

export async function uploadDocument(file: File): Promise<Doc> {
  // TODO: supabase.storage.from("papers").upload(...) → RAG API の /ingest で分割・埋め込み・要約
  const doc: Doc = {
    id: crypto.randomUUID(), title: file.name.replace(/\.pdf$/i, ""), authors: [], year: 0, venue: "—", abstract: "",
    tags: [], lang: "en", status: "processing", pages: 0, starred: false, created_at: new Date().toISOString(), cites: [],
  };
  const a = await ingest(doc, file);
  if (a) Object.assign(doc, { title: a.title ?? doc.title, authors: a.authors, year: a.year, venue: a.venue ?? doc.venue });
  (await load()).docs.push(doc);
  await save();
  return doc;
}

export async function attachPdf(id: string, file: File) {
  const doc = (await load()).docs.find((d) => d.id === id);
  if (!doc) return;
  await ingest(doc, file);
  await save();
}

export async function getPdfUrl(id: string) {
  const b = await getPdf(id);
  return b && URL.createObjectURL(b);
}

export async function deleteDocument(id: string) {
  const s = await load();
  s.docs = s.docs.filter((d) => d.id !== id).map((d) => ({ ...d, cites: d.cites.filter((c) => c !== id) }));
  s.chunks = s.chunks.filter((c) => c.document_id !== id);
  await Promise.all([save(), delPdf(id)]);
}

export async function semanticSearch(query: string, opts: { docIds?: string[]; limit?: number } = {}): Promise<SearchHit[]> {
  // TODO: RAG API の /search（query を embed → supabase.rpc("match_chunks", {...})）
  const s = await load();
  const q = tokens(query);
  return s.chunks
    .filter((c) => !opts.docIds || opts.docIds.includes(c.document_id))
    .map((c) => ({ chunk: c, doc: s.docs.find((d) => d.id === c.document_id)!, score: Math.min(0.98, 0.35 + 0.6 * sim(q, c.content)) }))
    .filter((h) => h.doc && h.score > 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit ?? 20);
}

// 文献内で「探したい文」をハイライトする
export const findInDocument = async (docId: string, query: string): Promise<Highlight[]> =>
  (await semanticSearch(query, { docIds: [docId], limit: 3 })).map((h, i) => ({
    id: `q${i}`, document_id: docId, chunk_id: h.chunk.id, kind: "ai_query", reason: `類似度 ${h.score.toFixed(2)}`,
  }));

// 原稿中の「(Author et al., 2020)」形式の引用を抽出し、該当文献の本文と照合する
export async function checkCitations(text: string): Promise<CitationCheck[]> {
  // TODO: RAG API の /factcheck（引用文献内を検索 → LLM で支持/矛盾を判定）
  const s = await load();
  const sentences = text.match(/[^.!?。]+?\([^()]*?\d{4}\)[^.!?。]*[.!?。]?/g) ?? [];
  return sentences.map((sent, i): CitationCheck => {
    const citation = sent.match(/\(([^()]*?\d{4})\)/)![1];
    const [, author = "", year] = citation.match(/([A-Za-z\u3040-\u9fff]+)[^\d]*(\d{4})/) ?? [];
    const claim = sent.replace(/\s*\([^()]*?\d{4}\)/, "").trim();
    const doc = s.docs.find((d) => (!d.year || d.year === +year) && d.authors.some((a) => a.split(" ").includes(author)));
    if (!doc) return { id: `c${i}`, claim, citation, verdict: "not_found", score: 0, note: "ライブラリ内に該当する文献がありません。実在しない引用（ハルシネーション）か、まだ登録していない文献の可能性があります。" };
    const q = tokens(claim);
    const evidence = s.chunks.filter((c) => c.document_id === doc.id).sort((a, b) => sim(q, b.content) - sim(q, a.content))[0];
    if (!evidence) return { id: `c${i}`, claim, citation, doc, verdict: "not_found", score: 0, note: "文献は登録されていますが、本文（PDF）がないため照合できません。" };
    const score = sim(q, evidence.content);
    return { id: `c${i}`, claim, citation, doc, evidence, verdict: score > 0.5 ? "supported" : "partial", score,
      note: "本文中で最も近い記述を根拠として表示しています（支持・矛盾の判定は LLM 接続後に行います）。" };
  });
}

export async function getGraph(): Promise<{ docs: Doc[]; edges: GraphEdge[] }> {
  // TODO: document_relations テーブル（cites）+ 文献ベクトルの類似度上位（similar）
  const s = await load();
  const docs = s.docs.filter((d) => d.status === "indexed");
  const edges: GraphEdge[] = docs.flatMap((d) => d.cites.map((t) => ({ source: d.id, target: t, kind: "cites" as const, weight: 1 })));
  const vocab = Object.fromEntries(docs.map((d) => [d.id, tokens(`${d.title} ${d.abstract} ${s.chunks.filter((c) => c.document_id === d.id).slice(0, 4).map((c) => c.content).join(" ")}`)]));
  for (const a of docs) for (const b of docs) {
    if (a.id >= b.id || edges.some((e) => [e.source, e.target].includes(a.id) && [e.source, e.target].includes(b.id))) continue;
    const A = vocab[a.id], B = vocab[b.id], w = [...A].filter((x) => B.has(x)).length / Math.max(1, Math.min(A.size, B.size));
    if (w >= 0.3) edges.push({ source: a.id, target: b.id, kind: "similar", weight: w });
  }
  return { docs, edges };
}

// PDF 本文の文から「探したい文」に近いものを選ぶ
// TODO: RAG API の /search（document_id を指定）に置き換え、返ってきた chunk の本文でハイライトする
export const rankSentences = <T extends { text: string }>(query: string, sents: T[], limit = 3) => {
  const q = tokens(query);
  const r = sents.map((s) => ({ ...s, score: sim(q, s.text) })).sort((a, b) => b.score - a.score);
  return r.filter((s) => s.score > 0.15 && s.score >= r[0].score * 0.7).slice(0, limit);
};

// 重要文の抽出（モック）。TODO: アップロード時に LLM で抽出して highlights テーブルへ保存
const cue = /\b(we (propose|present|show|find|demonstrate)|in this (paper|study)|our results?|results? (show|suggest|indicate))\b|本研究|明らかに/i;
export const pickKeySentences = <T extends { text: string }>(sents: T[], limit = 6) => sents.filter((s) => cue.test(s.text)).slice(0, limit);
