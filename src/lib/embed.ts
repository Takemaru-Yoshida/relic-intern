// ブラウザ内の埋め込みモデル（Transformers.js / ONNX）。初回はモデルをダウンロードし、以後はブラウザにキャッシュされる
export const MODELS = {
  "Xenova/bge-m3": { label: "BAAI/bge-m3", note: "多言語・高精度（推奨）", size: "約 570MB", dim: 1024, pooling: "cls", query: "", passage: "" },
  "Xenova/multilingual-e5-small": { label: "multilingual-e5-small", note: "多言語・軽量", size: "約 120MB", dim: 384, pooling: "mean", query: "query: ", passage: "passage: " },
} as const;
export type ModelId = keyof typeof MODELS;
const KEY = "docmeg:embed-model";
export const getModel = (): ModelId => (localStorage.getItem(KEY) as ModelId) in MODELS ? (localStorage.getItem(KEY) as ModelId) : "Xenova/bge-m3";
export const setModel = (m: ModelId) => localStorage.setItem(KEY, m);

// 進捗（モデルのダウンロード・ベクトル化）を UI に通知
export type EmbedStatus = { phase: "idle" } | { phase: "download"; loaded: number; total: number } | { phase: "embed"; done: number; total: number } | { phase: "error"; message: string };
const listeners = new Set<(s: EmbedStatus) => void>();
export const onStatus = (f: (s: EmbedStatus) => void) => (listeners.add(f), () => void listeners.delete(f));
const emit = (s: EmbedStatus) => listeners.forEach((f) => f(s));

let worker: Worker | null = null;
let seq = 0;
const files: Record<string, [number, number]> = {};

export function embed(texts: string[], kind: "query" | "passage"): Promise<number[][]> {
  const model = getModel(), m = MODELS[model];
  worker ??= new Worker(new URL("./embed.worker.ts", import.meta.url), { type: "module" });
  const id = ++seq, w = worker;
  return new Promise((resolve, reject) => {
    const onMsg = ({ data }: MessageEvent) => {
      if (data.id !== id) return;
      if (data.load?.status === "progress" && data.load.total) {
        files[data.load.file] = [data.load.loaded, data.load.total];
        const v = Object.values(files);
        emit({ phase: "download", loaded: v.reduce((a, [l]) => a + l, 0), total: v.reduce((a, [, t]) => a + t, 0) });
      } else if (data.done !== undefined && texts.length > 1) emit({ phase: "embed", done: data.done, total: data.total });
      else if (data.vectors) (w.removeEventListener("message", onMsg), emit({ phase: "idle" }), resolve(data.vectors));
      else if (data.error) (w.removeEventListener("message", onMsg), emit({ phase: "error", message: data.error }), reject(new Error(data.error)));
    };
    w.addEventListener("message", onMsg);
    w.postMessage({ id, model, pooling: m.pooling, texts: texts.map((t) => m[kind] + t) });
  });
}

export const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0); // 正規化済みなので内積 = コサイン類似度
export const mean = (vs: number[][]) => {
  const v = vs[0].map((_, i) => vs.reduce((s, x) => s + x[i], 0) / vs.length), n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
};
