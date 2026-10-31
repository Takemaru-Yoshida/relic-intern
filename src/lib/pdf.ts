// PDF のテキストと「引用文（quote）」を照合し、テキストレイヤー上のハイライト範囲を求める
import type { PDFDocumentProxy } from "pdfjs-dist";

export type MarkKind = "ai" | "query" | "user";
export interface Mark { id: string; quote: string; kind: MarkKind; note?: string }
interface PageText { items: string[]; text: string; key: string; map: [number, number][] } // map: key の各文字 → [item, offset]
export type Ranges = Record<number, Record<number, [number, number, MarkKind][]>>; // page → item → [start, end, kind]

const norm = (s: string) => s.normalize("NFKC").toLowerCase();
const isKey = (c: string) => /[\p{L}\p{N}]/u.test(c);
const keyOf = (s: string) => [...norm(s)].filter(isKey).join("");

export async function extractPages(pdf: PDFDocumentProxy): Promise<PageText[]> {
  return Promise.all(
    Array.from({ length: pdf.numPages }, async (_, i) => {
      const { items } = await (await pdf.getPage(i + 1)).getTextContent();
      const strs = items.map((it) => ("str" in it ? it.str : ""));
      const map: [number, number][] = [];
      let key = "";
      strs.forEach((s, ii) => [...s].forEach((c, ci) => {
        for (const k of norm(c)) if (isKey(k)) { key += k; map.push([ii, ci]); }
      }));
      const text = items.map((it) => ("str" in it ? it.str + (it.hasEOL ? " " : "") : "")).join("").replace(/-\s+(?=\p{Ll})/gu, "").replace(/\s+/g, " ");
      return { items: strs, text, key, map };
    }),
  );
}

// 空白・記号・改行・ハイフネーションを無視して照合。全文一致しなければ先頭 40 字で位置を推定
function locate(pages: PageText[], quote: string) {
  const q = keyOf(quote);
  if (q.length < 4) return null;
  for (const [p, pg] of pages.entries()) {
    let i = pg.key.indexOf(q), len = q.length;
    if (i < 0 && q.length > 60) (i = pg.key.indexOf(q.slice(0, 40))), (len = Math.min(q.length, pg.key.length - i));
    if (i >= 0) return { page: p, from: i, to: i + len };
  }
  return null;
}

export function buildRanges(pages: PageText[], marks: Mark[]) {
  const ranges: Ranges = {};
  const pageOf: Record<string, number> = {};
  for (const m of marks) {
    const hit = locate(pages, m.quote);
    if (!hit) continue;
    pageOf[m.id] = hit.page + 1;
    // 先頭〜末尾の文字を含む item を連続して塗る（単語間の空白 item も含めて隙間なく）
    const { map, items } = pages[hit.page];
    const [i0, c0] = map[hit.from], [i1, c1] = map[hit.to - 1];
    for (let it = i0; it <= i1; it++)
      ((ranges[hit.page] ??= {})[it] ??= []).push([it === i0 ? c0 : 0, it === i1 ? c1 + 1 : items[it].length, m.kind]);
  }
  return { ranges, pageOf };
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const rank: Record<MarkKind, number> = { ai: 0, user: 1, query: 2 };

// react-pdf の customTextRenderer 用：item 内の該当文字を <mark> で包む
export function renderItem(str: string, list?: [number, number, MarkKind][]) {
  if (!list) return esc(str);
  const kinds: (MarkKind | null)[] = Array(str.length).fill(null);
  for (const [s, e, k] of list) for (let i = s; i < e; i++) if (!kinds[i] || rank[k] > rank[kinds[i]!]) kinds[i] = k;
  let html = "", i = 0;
  while (i < str.length) {
    let j = i;
    while (j < str.length && kinds[j] === kinds[i]) j++;
    html += kinds[i] ? `<mark class="hl-${kinds[i]}">${esc(str.slice(i, j))}</mark>` : esc(str.slice(i, j));
    i = j;
  }
  return html;
}

export const sentencesOf = (pages: PageText[]) =>
  pages.flatMap((p, i) => p.text.split(/(?<=[.!?。])\s+/).filter((s) => s.length > 30).map((s) => ({ page: i + 1, text: s.trim() })));

// タイトル検出：① PDF メタデータの Title（それらしい場合のみ）② 1 ページ目の上半分で最も大きい文字の行
const junkTitle = /^(untitled|microsoft (word|powerpoint)|.*\.(pdf|docx?|tex|dvi|ps)$|paper|manuscript|main|document\d*)$/i;

type Info = Record<string, unknown>;

function titleFromInfo(info: Info) {
  const t = String(info.Title ?? "").trim();
  return t.length >= 8 && !junkTitle.test(t) && !/^microsoft /i.test(t) ? t : null;
}

async function titleFromLayout(pdf: PDFDocumentProxy) {
  const page = await pdf.getPage(1);
  const { height } = page.getViewport({ scale: 1 });
  const items = (await page.getTextContent()).items
    .filter((it): it is Extract<typeof it, { str: string }> => "str" in it && !!it.str.trim())
    .filter((it) => Math.abs(it.transform[1]) < 0.01 && Math.abs(it.transform[2]) < 0.01) // 回転文字（arXiv の透かし等）を除く
    .map((it) => ({ str: it.str, size: Math.abs(it.transform[3]), y: it.transform[5] }))
    .filter((it) => it.y > height * 0.4);
  const max = Math.max(...items.filter((it) => it.str.trim().length > 3).map((it) => it.size));
  if (!isFinite(max)) return null;
  // 最大サイズの文字を上から拾い、行間が大きく空いたら打ち切る
  const big = items.filter((it) => it.size >= max * 0.9).sort((a, b) => b.y - a.y);
  const lines: typeof big = [];
  for (const it of big) if (!lines.length || lines[lines.length - 1].y - it.y < max * 2.5) lines.push(it); else break;
  const title = lines.map((l) => l.str).join(" ").replace(/-\s+(?=\p{Ll})/gu, "").replace(/\s+/g, " ").trim();
  return title.length >= 4 ? title.slice(0, 300) : null;
}

// 本文をページごとに 600 字程度のまとまり（chunk）に分ける
const toChunks = (pages: PageText[]) =>
  pages.flatMap((p, i) => {
    const out: string[] = [];
    for (const s of p.text.split(/(?<=[.!?。])\s+/)) {
      if (out.length && out[out.length - 1].length + s.length < 600) out[out.length - 1] += " " + s;
      else out.push(s);
    }
    return out.map((t) => t.trim()).filter((t) => t.length > 20).map((content) => ({ page: i + 1, content }));
  });

// アップロード時の解析：タイトル・著者・年（メタデータにあれば）と本文 chunk
export async function analyzePdf(file: Blob) {
  const { pdfjs } = await import("./pdfjs");
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  try {
    const info = ((await pdf.getMetadata()).info ?? {}) as Info;
    const custom = (info.Custom ?? {}) as Info; // PDF 独自の項目（Published / Book など）
    const author = String(info.Author ?? "").trim();
    const year = Number(String(custom.Published ?? custom.Date ?? "").match(/^(19|20)\d{2}/)?.[0] ?? 0);
    return {
      title: titleFromInfo(info) ?? (await titleFromLayout(pdf)),
      authors: /\p{L}+ \p{L}+/u.test(author) ? author.split(/\s*(?:,|;| and )\s*/).filter(Boolean) : [],
      year,
      venue: String(custom.Book ?? custom.Journal ?? "").trim() || null,
      pages: pdf.numPages,
      chunks: toChunks(await extractPages(pdf)),
    };
  } finally {
    pdf.destroy();
  }
}
