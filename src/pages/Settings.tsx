import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { indexStats, reindexAll } from "@/lib/api";
import { MODELS, getModel, setModel, type ModelId } from "@/lib/embed";
import { useAsync } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label, Switch } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared";
import { supabase } from "@/lib/supabase";

const toggles = [
  ["auto-mark", "アップロード時に重要文へ自動でマーカーを付ける", true],
  ["auto-link", "新しい文献を関連グラフへ自動で追加する", true],
  ["strict", "ファクトチェックで「一部支持」も要確認として扱う", false],
] as const;

function EmbedSettings() {
  const [model, setM] = useState(getModel());
  const [busy, setBusy] = useState(false);
  const { data: st, setData } = useAsync(indexStats, [model]);
  const choose = (m: ModelId) => (setModel(m), setM(m));
  const run = async () => (setBusy(true), await reindexAll().catch(() => 0), setData(await indexStats()), setBusy(false));
  return (
    <Card>
      <CardHeader>
        <CardTitle>埋め込みモデル（意味検索）</CardTitle>
        <CardDescription>ブラウザ内で動作します。初回のみモデルをダウンロードし、以後はブラウザに保存されます。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(MODELS) as ModelId[]).map((id) => (
            <button key={id} onClick={() => choose(id)} className={cn("rounded-lg border p-3 text-left text-sm transition hover:bg-muted/50", model === id && "border-primary ring-2 ring-primary/30")}>
              <p className="font-semibold">{MODELS[id].label}</p>
              <p className="text-xs text-muted-foreground">{MODELS[id].note} · {MODELS[id].dim} 次元 · {MODELS[id].size}</p>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>このモデルでベクトル化済み：{st ? `${st.done} / ${st.total} 件` : "–"}</span>
          <Button size="sm" variant="outline" disabled={busy || !st || st.done === st.total} onClick={run}>{busy && <Loader2 className="animate-spin" />}未計算の文献をベクトル化</Button>
        </div>
        <p className="text-xs text-muted-foreground">モデルを切り替えた場合は、文献をベクトル化し直すまでキーワード検索で動作します。</p>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  return (
    <>
      <PageHeader title="設定" />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader><CardTitle>プロフィール</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="n">氏名</Label><Input id="n" defaultValue="吉田 研究室" /></div>
            <div className="space-y-2"><Label htmlFor="m">メールアドレス</Label><Input id="m" type="email" defaultValue="lab@univ.ac.jp" /></div>
            <div className="sm:col-span-2"><Button>保存</Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>AI 機能</CardTitle><CardDescription>マーカー・グラフ・ファクトチェックの動作</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {toggles.map(([id, label, on]) => (
              <div key={id} className="flex items-center justify-between gap-4"><Label htmlFor={id} className="font-normal">{label}</Label><Switch id={id} defaultChecked={on} /></div>
            ))}
          </CardContent>
        </Card>
        <EmbedSettings />
        <Card>
          <CardHeader><CardTitle>システム情報</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Embedding モデル</span><span className="text-right">{MODELS[getModel()].label}（ブラウザ内・Transformers.js）</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">バックエンド</span>{supabase ? <Badge variant="verified">Supabase 接続済み</Badge> : <Badge variant="partial">ブラウザ内に保存（IndexedDB）</Badge>}</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
