// 埋め込み計算用の Web Worker（UI を止めないよう別スレッドで Transformers.js を動かす）
import { env, pipeline } from "@huggingface/transformers";

env.allowLocalModels = false;
type Extractor = (t: string[], o: object) => Promise<{ tolist(): number[][] }>;
let cur: { model: string; p: Promise<Extractor> } | null = null;

self.onmessage = async ({ data: { id, model, pooling, texts } }) => {
  try {
    if (cur?.model !== model) {
      const p = pipeline("feature-extraction", model, { dtype: "q8", device: "wasm", progress_callback: (e: unknown) => self.postMessage({ id, load: e }) });
      cur = { model, p: p as unknown as Promise<Extractor> };
    }
    const ext = await cur!.p;
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += 8) {
      out.push(...(await ext(texts.slice(i, i + 8), { pooling, normalize: true })).tolist());
      self.postMessage({ id, done: out.length, total: texts.length });
    }
    self.postMessage({ id, vectors: out });
  } catch (e) {
    cur = null;
    self.postMessage({ id, error: String(e) });
  }
};
