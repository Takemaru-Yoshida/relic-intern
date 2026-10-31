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
