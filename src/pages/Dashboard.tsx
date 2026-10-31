import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, FileText, Layers, Network, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocCard, PageHeader, Spinner } from "@/components/shared";
import { UploadDialog } from "./Library";
import { listDocuments } from "@/lib/api";
import { useAsync } from "@/lib/hooks";

export default function Dashboard() {
  const { data: docs, loading, setData } = useAsync(listDocuments);
  const stats = [
    { label: "登録文献", value: docs?.length ?? "–", icon: BookOpen },
    { label: "PDF 保存済み", value: docs?.filter((d) => d.has_pdf).length ?? "–", icon: FileText },
    { label: "総ページ数", value: docs?.reduce((n, d) => n + d.pages, 0) ?? "–", icon: Layers },
  ];
  const actions = [
    { to: "/app/factcheck", icon: ShieldCheck, t: "原稿の引用をチェック", d: "AI が書いた文章の引用を原文と照合" },
    { to: "/app/search", icon: Search, t: "意味で検索", d: "日本語の質問で英語論文の一節を探す" },
    { to: "/app/graph", icon: Network, t: "関連グラフを見る", d: "先行研究どうしのつながりを可視化" },
  ];
  return (
    <>
      <PageHeader title="ダッシュボード" desc="おかえりなさい。今日も確かな引用を。"><UploadDialog onUploaded={(d) => setData((p) => [d, ...(p ?? []).filter((x) => x.id !== d.id)])} /></PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className="grid size-11 place-items-center rounded-md bg-secondary text-primary"><Icon className="size-5" /></span>
            <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {actions.map(({ to, icon: Icon, t, d }) => (
          <Link key={to} to={to}>
            <Card className="group h-full p-5 transition hover:border-primary/40 hover:shadow-md">
              <Icon className="mb-3 size-5 text-primary" />
              <p className="flex items-center gap-1 font-semibold">{t}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>最近追加した文献</CardTitle>
            <Button variant="link" size="sm" asChild><Link to="/app/library">すべて見る</Link></Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {loading ? <Spinner /> : docs!.length ? docs!.slice(0, 4).map((d) => <DocCard key={d.id} doc={d} />) : <p className="py-8 text-center text-sm text-muted-foreground sm:col-span-2">まだ文献がありません。「文献を追加」から PDF をアップロードしてください。</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>はじめかた</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {["「文献を追加」から論文の PDF をアップロード（DOI からも追加できます）", "文献を開き、PDF 上の重要文や探したい文にマーカーを付ける", "AI が書いた原稿を「引用ファクトチェック」に貼り、引用を原文と照合する"].map((t, i) => (
                <li key={i} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">{i + 1}</span>{t}</li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">追加した文献と PDF は、このブラウザ内に保存されます。</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
