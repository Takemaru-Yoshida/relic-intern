// ブラウザ内の永続ストア（IndexedDB）。Supabase 接続後は documents / chunks テーブルと Storage に置き換える
import { del, get, set } from "idb-keyval";
import type { Chunk, Doc } from "./types";

type Store = { docs: Doc[]; chunks: Chunk[] };
let cache: Promise<Store> | null = null;

export const load = () => (cache ??= Promise.all([get<Doc[]>("docs"), get<Chunk[]>("chunks")]).then(([docs, chunks]) => ({ docs: docs ?? [], chunks: chunks ?? [] })));

export async function save() {
  const s = await load();
  await Promise.all([set("docs", s.docs), set("chunks", s.chunks)]);
}

export const putPdf = (id: string, pdf: Blob) => set(`pdf:${id}`, pdf);
export const getPdf = (id: string) => get<Blob>(`pdf:${id}`);
export const delPdf = (id: string) => del(`pdf:${id}`);
