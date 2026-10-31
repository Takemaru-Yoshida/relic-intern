// データアクセス層。UI はこのファイルの関数だけを呼ぶ。
// Supabase / Python RAG API への接続時は各関数の中身だけを差し替える（TODO コメント参照）。
import { chunks, docs, highlights, presetVerdicts } from "./mock";
import type { CitationCheck, Doc, GraphEdge, Highlight, SearchHit } from "./types";

const wait = <T,>(v: T, ms = 350) => new Promise<T>((r) => setTimeout(() => r(v), ms));

// --- 擬似 Embedding（モック）: 日英の簡易辞書 + 単語重なり。本番は bge-m3 のベクトル類似度 ---
const dict: Record<string, string> = {
  注意: "attention", 表現: "representation", 深層: "deep", 深い: "deep deeper", 学習: "learning", ネットワーク: "network networks", 防: "prevent reduces", 自動: "adaptive", 残差: "residual",
  過学習: "overfitting regularization dropout", 正則化: "regularization regularizer", 最適化: "optimization", 学習率: "learning rates",
  画像: "image images", 単語: "words", 列: "sequences", 生成: "generative generation", 敵対: "adversarial", 識別: "discriminative",
  事前学習: "pre-train pre-trained", 言語: "language", 翻訳: "translation", 正規化: "normalization", 勾配: "gradient",
  並列: "parallelizable", 分類: "classification classify", 層: "layer layers", 調整: "adaptive",
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

export const listDocuments = () => wait([...docs]);
// TODO: supabase.from("documents").select("*").order("created_at", { ascending: false })

export const getDocument = (id: string) =>
  wait({
    doc: docs.find((d) => d.id === id),
    chunks: chunks.filter((c) => c.document_id === id),
    highlights: highlights.filter((h) => h.document_id === id),
  });
// TODO: documents / chunks / highlights を document_id で取得

export async function uploadDocument(file: File): Promise<Doc> {
  // TODO: supabase.storage.from("papers").upload(...) → RAG API の /ingest を呼んで分割・埋め込み
  const doc: Doc = {
    id: crypto.randomUUID(), title: file.name.replace(/\.pdf$/i, ""), authors: ["（解析中）"], year: new Date().getFullYear(),
    venue: "—", abstract: "", tags: [], lang: "en", status: "processing", pages: 0, starred: false,
    created_at: new Date().toISOString(), cites: [], file_url: URL.createObjectURL(file),
  };
  docs.unshift(doc);
  return wait(doc, 600);
}

export async function semanticSearch(query: string, opts: { docIds?: string[]; limit?: number } = {}): Promise<SearchHit[]> {
  // TODO: RAG API の /search（query を embed → supabase.rpc("match_chunks", {...})）
  const q = tokens(query);
  const hits = chunks
    .filter((c) => !opts.docIds || opts.docIds.includes(c.document_id))
    .map((c) => ({ chunk: c, doc: docs.find((d) => d.id === c.document_id)!, score: Math.min(0.98, 0.35 + 0.6 * sim(q, c.content + " " + c.section)) }))
    .filter((h) => h.score > 0.45)
    .sort((a, b) => b.score - a.score);
  return wait(hits.slice(0, opts.limit ?? 20), 500);
}

// 文献内で「探したい文」をハイライトする
export const findInDocument = async (docId: string, query: string): Promise<Highlight[]> =>
  (await semanticSearch(query, { docIds: [docId], limit: 3 })).map((h, i) => ({
    id: `q${i}`, document_id: docId, chunk_id: h.chunk.id, kind: "ai_query", reason: `類似度 ${h.score.toFixed(2)}`,
  }));

// 原稿中の「(Author et al., 2020)」形式の引用を抽出し、該当文献の本文と照合する
export async function checkCitations(text: string): Promise<CitationCheck[]> {
  // TODO: RAG API の /factcheck（引用文献内を検索 → LLM で支持/矛盾を判定）
  const sentences = text.match(/[^.!?。]+?\([^()]*?\d{4}\)[^.!?。]*[.!?。]?/g) ?? [];
  const res = sentences.map((s, i): CitationCheck => {
    const citation = s.match(/\(([^()]*?\d{4})\)/)![1];
    const [, author, year] = citation.match(/([A-Za-z぀-鿿]+)[^\d]*(\d{4})/) ?? [];
    const claim = s.replace(/\s*\([^()]*?\d{4}\)/, "").trim();
    const doc = docs.find((d) => d.year === +year && d.authors.some((a) => a.includes(author)));
    if (!doc) return { id: `c${i}`, claim, citation, verdict: "not_found", score: 0, note: "ライブラリ内に該当する文献がありません。実在しない引用（ハルシネーション）の可能性があります。" };
    const preset = presetVerdicts[author];
    const cand = chunks.filter((c) => c.document_id === doc.id);
    const evidence = preset ? cand.find((c) => c.id === preset.chunk)! : cand.sort((a, b) => sim(tokens(claim), b.content) - sim(tokens(claim), a.content))[0];
    const score = preset ? { supported: 0.91, partial: 0.62, refuted: 0.83 }[preset.verdict] : sim(tokens(claim), evidence.content);
    const verdict = preset?.verdict ?? (score > 0.5 ? "supported" : "partial");
    return { id: `c${i}`, claim, citation, doc, evidence, verdict, score, note: preset?.note ?? "本文中の最も近い記述を根拠として表示しています。" };
  });
  return wait(res, 1200);
}

export async function getGraph(): Promise<{ docs: Doc[]; edges: GraphEdge[] }> {
  // TODO: document_relations テーブル（cites）+ 文献ベクトルの類似度上位（similar）
  const edges: GraphEdge[] = docs.flatMap((d) => d.cites.map((t) => ({ source: d.id, target: t, kind: "cites" as const, weight: 1 })));
  for (const a of docs) for (const b of docs) {
    if (a.id >= b.id) continue;
    const w = a.tags.filter((t) => b.tags.includes(t)).length / Math.max(1, Math.min(a.tags.length, b.tags.length));
    if (w >= 0.5 && !edges.some((e) => (e.source === a.id && e.target === b.id) || (e.source === b.id && e.target === a.id)))
      edges.push({ source: a.id, target: b.id, kind: "similar", weight: w });
  }
  return wait({ docs: docs.filter((d) => d.status === "indexed"), edges });
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
