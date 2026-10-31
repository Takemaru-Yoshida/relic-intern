import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Network, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocCard, PageHeader, Spinner, VerdictBadge } from "@/components/shared";
import { UploadDialog } from "./Library";
import { listDocuments } from "@/lib/api";
import { useAsync } from "@/lib/hooks";

const recentChecks = [
  { title: "修士論文 第2章 草稿", n: 18, bad: 3, v: "refuted" as const, at: "2 時間前" },
  { title: "学会抄録（日本神経科学大会）", n: 6, bad: 0, v: "supported" as const, at: "昨日" },
];

export default function Dashboard() {
  const { data: docs, loading } = useAsync(listDocuments);
  const stats = [
    { label: "登録文献", value: docs?.length ?? "–", icon: BookOpen },
    { label: "チェック済みの引用", value: 24, icon: ShieldCheck },
    { label: "要確認の引用", value: 3, icon: ShieldAlert, warn: true },
  ];
  const actions = [
    { to: "/app/factcheck", icon: ShieldCheck, t: "原稿の引用をチェック", d: "AI が書いた文章の引用を原文と照合" },
    { to: "/app/search", icon: Search, t: "意味で検索", d: "日本語の質問で英語論文の一節を探す" },
    { to: "/app/graph", icon: Network, t: "関連グラフを見る", d: "先行研究どうしのつながりを可視化" },
  ];
  return (
    <>
      <PageHeader title="ダッシュボード" desc="おかえりなさい。今日も確かな引用を。"><UploadDialog /></PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, warn }) => (
          <Card key={label} className="flex items-center gap-4 p-5">
            <span className={`grid size-11 place-items-center rounded-md ${warn ? "bg-refuted/10 text-refuted" : "bg-secondary text-primary"}`}><Icon className="size-5" /></span>
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
            {loading ? <Spinner /> : docs!.slice(0, 4).map((d) => <DocCard key={d.id} doc={d} />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>最近のファクトチェック</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentChecks.map((c) => (
              <Link key={c.title} to="/app/factcheck" className="block rounded-md border p-3 hover:bg-muted/50">
                <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{c.title}</p><VerdictBadge v={c.v} /></div>
                <p className="mt-1 text-xs text-muted-foreground">引用 {c.n} 件 · 要確認 {c.bad} 件 · {c.at}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
