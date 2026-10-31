// Supabase のテーブル定義（supabase/schema.sql）と 1 対 1 に対応させる
export type DocStatus = "processing" | "indexed" | "error";

export interface Doc {
  id: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  doi?: string;
  abstract: string;
  tags: string[];
  lang: "en" | "ja";
  status: DocStatus;
  pages: number;
  starred: boolean;
  created_at: string;
  cites: string[]; // document_relations(kind = 'cites')
}

export interface Chunk {
  id: string;
  document_id: string;
  page: number;
  section: string;
  content: string;
}

export interface Highlight {
  id: string;
  document_id: string;
  chunk_id: string;
  kind: "ai_key" | "ai_query" | "user";
  reason?: string;
}

export interface SearchHit {
  chunk: Chunk;
  doc: Doc;
  score: number; // コサイン類似度（0–1）
}

export type Verdict = "supported" | "partial" | "refuted" | "not_found";

export interface CitationCheck {
  id: string;
  claim: string;
  citation: string;
  doc?: Doc;
  evidence?: Chunk;
  verdict: Verdict;
  score: number;
  note: string;
}

export interface GraphNode { id: string; doc: Doc }
export interface GraphEdge { source: string; target: string; kind: "cites" | "similar"; weight: number }
