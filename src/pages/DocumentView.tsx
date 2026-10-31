import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Highlighter, Loader2, Search, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch, Label } from "@/components/ui/misc";
import { Spinner, authorLine } from "@/components/shared";
import { findInDocument, getDocument, listDocuments } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Highlight } from "@/lib/types";

export default function DocumentView() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const { data, loading } = useAsync(() => getDocument(id), [id]);
  const { data: all } = useAsync(listDocuments);
  const [showAi, setShowAi] = useState(true);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Highlight[]>([]);
  const [busy, setBusy] = useState(false);
  const focus = params.get("chunk");

  useEffect(() => { focus && document.getElementById(focus)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [focus, data]);

  if (loading) return <Spinner />;
  if (!data?.doc) return <p className="py-16 text-center text-muted-foreground">文献が見つかりません</p>;
  const { doc, chunks, highlights } = data;
  const ai = new Map(highlights.map((h) => [h.chunk_id, h]));
  const qh = new Map(hits.map((h) => [h.chunk_id, h]));
  const related = all?.filter((d) => d.id !== doc.id && (doc.cites.includes(d.id) || d.cites.includes(doc.id) || d.tags.some((t) => doc.tags.includes(t)))).slice(0, 4);

  const find = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    const r = await findInDocument(doc.id, q);
    setHits(r);
    setBusy(false);
    r[0] && document.getElementById(r[0].chunk_id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-3"><Link to="/app/library"><ArrowLeft />ライブラリ</Link></Button>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0">
          <div className="mb-6 space-y-3 border-b pb-6">
            <div className="flex flex-wrap gap-1.5">{doc.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
            <h1 className="font-serif text-2xl font-semibold leading-snug sm:text-3xl">{doc.title}</h1>
            <p className="text-sm text-muted-foreground">{authorLine(doc)} · {doc.venue} · {doc.pages} ページ</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm"><Star className={cn(doc.starred && "fill-partial text-partial")} />お気に入り</Button>
              {doc.doi && <Button variant="outline" size="sm" asChild><a href={`https://doi.org/${doc.doi}`} target="_blank" rel="noreferrer"><ExternalLink />DOI</a></Button>}
            </div>
            <div className="rounded-md bg-secondary/60 p-4 text-sm leading-relaxed"><span className="mr-2 inline-flex items-center gap-1 font-semibold text-primary"><Sparkles className="size-4" />AI 要約</span>{doc.abstract}</div>
          </div>
          <div className="space-y-5 font-serif text-[15px] leading-8">
            {chunks.map((c, i) => {
              const k = showAi && ai.get(c.id), m = qh.get(c.id);
              return (
                <section key={c.id} id={c.id} className={cn("scroll-mt-24 rounded-md p-1 transition", focus === c.id && "ring-2 ring-primary/40")}>
                  {c.section !== chunks[i - 1]?.section && <h2 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-muted-foreground">{c.section}</h2>}
                  <p>
                    <span className={cn(m ? "mark" : k && "mark-ai")}>{c.content}</span>
                    <span className="ml-2 font-sans text-xs text-muted-foreground">p.{c.page}</span>
                  </p>
                  {(m || k) && <p className="mt-1 font-sans text-xs text-muted-foreground">{m ? `🔍 「${q}」に一致 · ${m.reason}` : `✦ ${k && k.reason}`}</p>}
                </section>
              );
            })}
          </div>
        </article>

        <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-8 lg:self-start">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Search className="size-4 text-primary" />探したい文を探す</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={find} className="flex gap-2">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="例：比較に使う指標" />
                <Button size="icon" disabled={busy} aria-label="検索">{busy ? <Loader2 className="animate-spin" /> : <Highlighter />}</Button>
              </form>
              <p className="text-xs text-muted-foreground">意味が近い文に<span className="mark mx-1">黄色のマーカー</span>が付きます。日本語でも検索できます。</p>
              {hits.length > 0 && <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setHits([])}>マーカーを消す</Button>}
              <div className="flex items-center justify-between border-t pt-3">
                <Label htmlFor="ai">AI 重要文マーカー</Label>
                <Switch id="ai" checked={showAi} onCheckedChange={setShowAi} />
              </div>
            </CardContent>
          </Card>
          <Card className="hidden lg:block">
            <CardHeader className="pb-3"><CardTitle className="text-base">AI が選んだ重要文</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {highlights.map((h) => (
                <a key={h.id} href={`#${h.chunk_id}`} className="block rounded-md border-l-4 border-verified bg-muted/50 p-2 text-xs hover:bg-muted">{h.reason}</a>
              ))}
            </CardContent>
          </Card>
          {!!related?.length && (
            <Card className="hidden lg:block">
              <CardHeader className="pb-3"><CardTitle className="text-base">関連文献</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {related.map((d) => <Link key={d.id} to={`/app/library/${d.id}`} className="block text-sm leading-snug hover:text-primary">{d.title}<span className="block text-xs text-muted-foreground">{authorLine(d)}</span></Link>)}
                <Button variant="outline" size="sm" className="mt-2 w-full" asChild><Link to={`/app/graph?focus=${doc.id}`}>グラフで見る</Link></Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
