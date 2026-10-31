import { Button } from "@/components/ui/button";
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
        <Card>
          <CardHeader><CardTitle>システム情報</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Embedding モデル</span><span className="text-right">BAAI/bge-m3（多言語・1024 次元）</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">バックエンド</span>{supabase ? <Badge variant="verified">Supabase 接続済み</Badge> : <Badge variant="partial">デモモード（モックデータ）</Badge>}</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
