import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, FileText, FileUp, Highlighter, Loader2, Search, Sparkles, Star, Type, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch, Label } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner, authorLine } from "@/components/shared";
import { findInDocument, getDocument, listDocuments, pickKeySentences, rankSentences } from "@/lib/api";
import { makeSamplePdf } from "@/lib/samplePdf";
import { sentencesOf, type Mark } from "@/lib/pdf";
import { useAsync } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Highlight } from "@/lib/types";

const PdfViewer = lazy(() => import("@/components/PdfViewer"));
const swatch = { ai: "bg-verified/35", query: "bg-marker", user: "bg-pink-300" };
const kindLabel = { ai: "AI 重要文", query: "検索一致", user: "自分のマーカー" };

export default function DocumentView() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const { data, loading } = useAsync(() => getDocument(id), [id]);
  const { data: all } = useAsync(listDocuments);
  const [showAi, setShowAi] = useState(true);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Highlight[]>([]);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string>();
  const [sents, setSents] = useState<{ page: number; text: string }[]>([]);
  const [queryMarks, setQueryMarks] = useState<Mark[]>([]);
  const [userMarks, setUserMarks] = useState<Mark[]>([]);
  const [pageOf, setPageOf] = useState<Record<string, number>>({});
  const [focus, setFocus] = useState<{ id: string; n: number }>();
  const [tab, setTab] = useState("pdf");
  const [local, setLocal] = useState(false); // 手元の PDF を開いているか
  const fileRef = useRef<HTMLInputElement>(null);
  const chunkParam = params.get("chunk");

  // PDF の用意：アップロード済みならその URL、デモ文献は本文から生成
  useEffect(() => {
    if (!data?.doc) return;
    setUrl(undefined); setLocal(false); setSents([]); setQueryMarks([]); setUserMarks([]); setHits([]);
    if (data.doc.file_url) setUrl(data.doc.file_url);
    else if (data.doc.lang === "en" && data.chunks.length) makeSamplePdf(data.doc, data.chunks).then(setUrl);
    else setTab("text");
  }, [data]);

  useEffect(() => { if (chunkParam) { setFocus({ id: `chunk-${chunkParam}`, n: Date.now() }); tab === "text" && document.getElementById(chunkParam)?.scrollIntoView({ behavior: "smooth", block: "center" }); } }, [chunkParam, data, tab]);

  const marks = useMemo<Mark[]>(() => {
    if (!data) return [];
    const ai: Mark[] = !showAi ? [] : data.highlights.length && !local
      ? data.highlights.map((h) => ({ id: h.id, kind: "ai", quote: data.chunks.find((c) => c.id === h.chunk_id)!.content, note: h.reason }))
      : pickKeySentences(sents).map((s, i) => ({ id: `ai${i}`, kind: "ai", quote: s.text }));
    const linked = !local && data.chunks.find((c) => c.id === chunkParam);
    return [...ai, ...userMarks, ...queryMarks, ...(linked ? [{ id: `chunk-${linked.id}`, kind: "query" as const, quote: linked.content, note: "リンク元の一節" }] : [])];
  }, [data, showAi, sents, userMarks, queryMarks, chunkParam, local]);

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
    const r = chunks.length ? await findInDocument(doc.id, q) : [];
    setHits(r);
    const qm: Mark[] = sents.length
      ? rankSentences(q, sents).map((s, i) => ({ id: `q${i}`, kind: "query", quote: s.text, note: `「${q}」に一致 · 類似度 ${s.score.toFixed(2)}` }))
      : r.map((h) => ({ id: h.id, kind: "query", quote: chunks.find((c) => c.id === h.chunk_id)!.content, note: h.reason }));
    setQueryMarks(qm);
    setBusy(false);
    qm[0] && setFocus({ id: qm[0].id, n: Date.now() });
    tab === "text" && r[0] && document.getElementById(r[0].chunk_id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const openLocal = (f?: File) => f && (setUrl(URL.createObjectURL(f)), setLocal(true), setSents([]), setQueryMarks([]), setUserMarks([]), setTab("pdf"));

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
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><FileUp />手元の PDF を開く</Button>
              <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => openLocal(e.target.files?.[0])} />
            </div>
            <div className="rounded-md bg-secondary/60 p-4 text-sm leading-relaxed"><span className="mr-2 inline-flex items-center gap-1 font-semibold text-primary"><Sparkles className="size-4" />AI 要約</span>{doc.abstract}</div>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="pdf" disabled={!url}><FileText />PDF</TabsTrigger>
              <TabsTrigger value="text" disabled={!chunks.length}><Type />テキスト</TabsTrigger>
            </TabsList>
            <TabsContent value="pdf">
              {url ? (
                <Suspense fallback={<Spinner label="PDF ビューアを準備中…" />}>
                  <PdfViewer url={url} marks={marks} focus={focus} onText={(p) => setSents(sentencesOf(p))} onLocate={setPageOf}
                    onSelectText={(text) => setUserMarks((m) => [...m, { id: `u${Date.now()}`, kind: "user", quote: text, note: text.slice(0, 40) }])} />
                </Suspense>
              ) : <Spinner label="PDF を準備中…" />}
              <p className="mt-2 text-xs text-muted-foreground">PDF 上の文字をドラッグして選択すると、自分でマーカーを引けます。</p>
            </TabsContent>
            <TabsContent value="text">
              <div className="space-y-5 font-serif text-[15px] leading-8">
                {chunks.map((c, i) => {
                  const k = showAi && ai.get(c.id), m = qh.get(c.id);
                  return (
                    <section key={c.id} id={c.id} className={cn("scroll-mt-24 rounded-md p-1 transition", chunkParam === c.id && "ring-2 ring-primary/40")}>
                      {c.section !== chunks[i - 1]?.section && <h2 className="mb-2 font-sans text-sm font-bold uppercase tracking-wider text-muted-foreground">{c.section}</h2>}
                      <p><span className={cn(m ? "mark" : k && "mark-ai")}>{c.content}</span><span className="ml-2 font-sans text-xs text-muted-foreground">p.{c.page}</span></p>
                      {(m || k) && <p className="mt-1 font-sans text-xs text-muted-foreground">{m ? `🔍 「${q}」に一致 · ${m.reason}` : `✦ ${k && k.reason}`}</p>}
                    </section>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
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
              {(hits.length > 0 || queryMarks.length > 0) && <Button variant="link" size="sm" className="h-auto p-0" onClick={() => (setHits([]), setQueryMarks([]))}>検索マーカーを消す</Button>}
              <div className="flex items-center justify-between border-t pt-3">
                <Label htmlFor="ai">AI 重要文マーカー</Label>
                <Switch id="ai" checked={showAi} onCheckedChange={setShowAi} />
              </div>
            </CardContent>
          </Card>
          {tab === "pdf" && marks.length > 0 && (
            <Card className="hidden lg:block">
              <CardHeader className="pb-3"><CardTitle className="text-base">マーカー一覧（{marks.length}）</CardTitle></CardHeader>
              <CardContent className="max-h-[40vh] space-y-1 overflow-auto">
                {marks.map((m) => (
                  <div key={m.id} className="group flex items-start gap-2 rounded-md p-1.5 hover:bg-muted">
                    <button className="flex min-w-0 flex-1 items-start gap-2 text-left" onClick={() => setFocus({ id: m.id, n: Date.now() })}>
                      <i className={cn("mt-1 size-3 shrink-0 rounded-sm", swatch[m.kind])} />
                      <span className="min-w-0 text-xs"><span className="line-clamp-2">{m.note ?? m.quote}</span>
                        <span className="text-muted-foreground">{kindLabel[m.kind]} · {pageOf[m.id] ? `p.${pageOf[m.id]}` : "本文に見つかりません"}</span></span>
                    </button>
                    {m.kind === "user" && <button aria-label="削除" className="opacity-60 hover:opacity-100" onClick={() => setUserMarks((u) => u.filter((x) => x.id !== m.id))}><X className="size-3.5" /></button>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
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
