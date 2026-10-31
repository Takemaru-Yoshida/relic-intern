// DOI / arXiv ID から書誌情報を取得する（Crossref → DataCite の順。どちらもブラウザから直接呼べる CORS 対応 API）
// TODO: Supabase 接続後は Edge Function 経由にし、OA の PDF（Unpaywall / arXiv）を Storage へ取り込んで RAG の /ingest に渡す
import { docs } from "./mock";
import type { Doc } from "./types";

// 入力（URL・"doi:"・arXiv ID など）を DOI に正規化する。arXiv ID は 10.48550/arXiv.XXXX に変換
export function normalizeId(raw: string) {
  const s = raw.trim().replace(/^(https?:\/\/)?(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  const ax = s.match(/(?:arxiv\.org\/(?:abs|pdf)\/|arxiv:\s*)?(\d{4}\.\d{4,5})(v\d+)?(\.pdf)?$/i);
  if (ax && !s.startsWith("10.")) return `10.48550/arXiv.${ax[1]}`;
  return /^10\.\d{4,9}\/\S+$/.test(s) ? s : null;
}

export const parseIds = (text: string) => [...new Set(text.split(/[\s,;]+/).filter(Boolean))].map((raw) => ({ raw, doi: normalizeId(raw) }));

export const findByDoi = (doi: string) => docs.find((d) => d.doi?.toLowerCase() === doi.toLowerCase());

const strip = (s = "") => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/^abstract\s*/i, "").trim();
const base = (doi: string): Omit<Doc, "title" | "authors" | "year" | "venue" | "abstract" | "pages"> => ({
  id: crypto.randomUUID(), doi, tags: [], lang: "en", status: "indexed", starred: false, created_at: new Date().toISOString(), cites: [], imported_from: "doi",
});

async function crossref(doi: string): Promise<Doc | null> {
  const r = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
  if (!r.ok) return null;
  const m = (await r.json()).message;
  const [from, to] = String(m.page ?? "").split("-").map(Number);
  return {
    ...base(doi), title: strip(m.title?.[0]) || doi,
    authors: (m.author ?? []).map((a: { given?: string; family?: string; name?: string }) => a.name ?? [a.given, a.family].filter(Boolean).join(" ")),
    year: (m.issued ?? m.published)?.["date-parts"]?.[0]?.[0] ?? 0,
    venue: m["container-title"]?.[0] ?? m.publisher ?? "—",
    abstract: strip(m.abstract) || "アブストラクトは登録されていません。",
    pages: to >= from ? to - from + 1 : 0,
  };
}

async function datacite(doi: string): Promise<Doc | null> {
  const r = await fetch(`https://api.datacite.org/dois/${encodeURIComponent(doi)}`);
  if (!r.ok) return null;
  const a = (await r.json()).data.attributes;
  return {
    ...base(doi), title: a.titles?.[0]?.title ?? doi,
    authors: (a.creators ?? []).map((c: { name: string; givenName?: string; familyName?: string }) => (c.givenName ? `${c.givenName} ${c.familyName}` : c.name)),
    year: a.publicationYear ?? 0, venue: a.publisher?.name ?? a.publisher ?? "—",
    abstract: strip(a.descriptions?.find((d: { descriptionType: string }) => d.descriptionType === "Abstract")?.description) || "アブストラクトは登録されていません。",
    pages: 0,
  };
}

export async function lookupDoi(doi: string): Promise<Doc> {
  const isArxiv = /^10\.48550\//i.test(doi);
  const doc = isArxiv ? await datacite(doi) : (await crossref(doi)) ?? (await datacite(doi));
  if (!doc) throw new Error("not_found");
  return doc;
}

// PDF の入手先（外部サイト）
export const pdfSource = (doi: string) => {
  const ax = doi.match(/^10\.48550\/arxiv\.(.+)$/i);
  return ax ? { label: "arXiv で PDF を開く", url: `https://arxiv.org/pdf/${ax[1]}` } : { label: "出版社のページを開く", url: `https://doi.org/${doi}` };
};

export const addDocuments = (list: Doc[]) => docs.unshift(...list); // TODO: supabase.from("documents").insert(list)
