import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/misc";
import { MODELS, getModel, onStatus, type EmbedStatus as S } from "@/lib/embed";

const mb = (n: number) => `${Math.round(n / 1e6)}MB`;

// 画面右下に、埋め込みモデルのダウンロード・ベクトル化の進捗を表示する
export default function EmbedStatus() {
  const [s, setS] = useState<S>({ phase: "idle" });
  useEffect(() => onStatus(setS), []);
  useEffect(() => { if (s.phase === "error") { const t = setTimeout(() => setS({ phase: "idle" }), 8000); return () => clearTimeout(t); } }, [s]);
  if (s.phase === "idle") return null;
  const [label, value] =
    s.phase === "download" ? [`${MODELS[getModel()].label} をダウンロード中（初回のみ）${mb(s.loaded)} / ${mb(s.total)}`, (100 * s.loaded) / s.total]
    : s.phase === "embed" ? [`本文をベクトル化中 ${s.done} / ${s.total}`, (100 * s.done) / s.total]
    : ["埋め込みモデルを読み込めませんでした。キーワード検索で動作します。", 0];
  return (
    <div role="status" className="fixed inset-x-4 bottom-4 z-50 rounded-lg border bg-background p-3 shadow-lg sm:left-auto sm:w-96">
      <p className="mb-2 flex items-center gap-2 text-xs">{s.phase !== "error" && <Loader2 className="size-3.5 animate-spin" />}{label}</p>
      {s.phase !== "error" && <Progress value={value} className="h-1.5" />}
    </div>
  );
}
