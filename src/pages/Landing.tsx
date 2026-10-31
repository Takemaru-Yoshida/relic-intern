import { Link } from "react-router-dom";
import { ArrowRight, FileSearch, Highlighter, Network, ShieldCheck, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo, VerdictBadge } from "@/components/shared";

const features = [
  { icon: ShieldCheck, title: "引用ファクトチェック", desc: "AI が書いた原稿の引用を、ライブラリ内の原文と自動で照合。「支持・一部支持・矛盾・文献なし」を根拠となる一文つきで示します。" },
  { icon: FileSearch, title: "意味で探せる検索", desc: "RAG により、キーワードが一致しなくても内容が近い一節を発見。日本語で英語論文を検索できます。" },
  { icon: Highlighter, title: "AI マーカー", desc: "重要な文には自動でマーカー。「探したい文」を入力すれば、その文献の該当箇所にハイライトが付きます。" },
  { icon: Network, title: "関連性グラフ", desc: "引用関係と内容の近さから文献同士のつながりを可視化。先行研究の全体像をひと目で把握できます。" },
];

const steps = [
  { icon: Upload, t: "PDF をアップロード", d: "本文を自動で分割・ベクトル化" },
  { icon: Sparkles, t: "AI が読む", d: "重要文の抽出と関連付け" },
  { icon: ShieldCheck, t: "原稿を照合", d: "引用ごとに根拠を提示" },
];

const preview = [
  { v: "supported" as const, claim: "残差学習により 152 層のネットワークを ImageNet で学習できた", cite: "He et al., 2016" },
  { v: "refuted" as const, claim: "特徴ベース注意は MT ニューロンのチューニングを鋭くする", cite: "Treue & Martinez-Trujillo, 1999" },
  { v: "not_found" as const, claim: "物体ベース注意は空間注意で完全に説明できる", cite: "Tanaka et al., 2021" },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link to="/login">ログイン</Link></Button>
          <Button asChild><Link to="/signup">無料ではじめる</Link></Button>
        </div>
      </header>

      <section className="container grid items-center gap-10 py-12 md:py-20 lg:grid-cols-2">
        <div className="space-y-6">
          <p className="inline-flex rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">AI 時代の新たなファクトチェック</p>
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            その引用、<br /><span className="mark">本当に書いて</span>ありますか？
          </h1>
          <p className="max-w-xl leading-relaxed text-muted-foreground">
            DocMeg は、論文の管理・意味検索・引用の自動照合をひとつにした文献管理アプリです。
            AI のハルシネーションによる誤引用を、原文の一文まで遡って確かめられます。
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild><Link to="/app">デモを試す<ArrowRight /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/app/factcheck">ファクトチェックを見る</Link></Button>
          </div>
        </div>
        <Card className="space-y-3 p-4 sm:p-6">
          <div className="flex items-center justify-between text-sm"><span className="font-semibold">原稿の引用チェック結果</span><span className="text-muted-foreground">3 件</span></div>
          {preview.map((p) => (
            <div key={p.cite} className="space-y-2 rounded-md border bg-background p-3">
              <div className="flex items-center justify-between gap-2"><VerdictBadge v={p.v} /><span className="truncate text-xs text-muted-foreground">{p.cite}</span></div>
              <p className="font-serif text-sm leading-relaxed">{p.claim}</p>
            </div>
          ))}
        </Card>
      </section>

      <section className="border-y bg-muted/40 py-16">
        <div className="container">
          <h2 className="mb-2 text-center text-2xl font-bold">研究者の「確かめる」を速くする</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">先行研究の探索から投稿前の引用確認まで</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-5">
                <Icon className="mb-3 size-6 text-primary" />
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, t, d }, i) => (
            <div key={t} className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Icon className="size-5" /></span>
              <div><p className="text-xs text-muted-foreground">STEP {i + 1}</p><p className="font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">© 2026 DocMeg</footer>
    </div>
  );
}
