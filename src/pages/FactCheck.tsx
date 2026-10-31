import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardPaste, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { PageHeader, VerdictBadge, authorLine, verdictMeta } from "@/components/shared";
import { checkCitations } from "@/lib/api";
import { sampleManuscript } from "@/lib/mock";
import { cn } from "@/lib/utils";
import type { CitationCheck, Verdict } from "@/lib/types";

const order: Verdict[] = ["refuted", "not_found", "partial", "supported"];
const tone: Record<Verdict, string> = { supported: "border-l-verified", partial: "border-l-partial", refuted: "border-l-refuted", not_found: "border-l-muted-foreground" };

export default function FactCheck() {
  const [text, setText] = useState("");
  const [res, setRes] = useState<CitationCheck[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Verdict | null>(null);

  const run = async () => (setBusy(true), setRes(await checkCitations(text)), setBusy(false));
  const count = (v: Verdict) => res?.filter((r) => r.verdict === v).length ?? 0;
  const shown = res?.filter((r) => !filter || r.verdict === filter).sort((a, b) => order.indexOf(a.verdict) - order.indexOf(b.verdict));

  return (
    <>
      <PageHeader title="引用ファクトチェック" desc="原稿を貼り付けると、各引用の主張がライブラリ内の原文に書かれているかを AI が照合します。" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="xl:sticky xl:top-8 xl:self-start">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">原稿</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setText(sampleManuscript)}><ClipboardPaste />サンプルを貼る</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[260px] font-serif" placeholder="例：Dropout removes units only at test time (Srivastava et al., 2014)." />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">(著者, 年) 形式の引用に対応</p>
              <Button onClick={run} disabled={!text.trim() || busy}>{busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}チェックする</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!res && !busy && <Card className="grid min-h-[200px] place-items-center p-8 text-center text-sm text-muted-foreground">結果はここに表示されます。<br />まずは「サンプルを貼る」で試してみてください。</Card>}
          {busy && <Card className="grid min-h-[200px] place-items-center p-8 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />引用文献の本文を検索して照合しています…</span></Card>}
          {res && !busy && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {order.map((v) => (
                  <button key={v} onClick={() => setFilter(filter === v ? null : v)} className={cn("rounded-lg border bg-card p-3 text-left transition hover:shadow-sm", filter === v && "ring-2 ring-primary")}>
                    <p className="text-2xl font-bold">{count(v)}</p>
                    <p className="text-xs text-muted-foreground">{verdictMeta[v].label}</p>
                  </button>
                ))}
              </div>
              {!res.length && <p className="py-8 text-center text-sm text-muted-foreground">引用が見つかりませんでした</p>}
              {shown!.map((r) => (
                <Card key={r.id} className={cn("space-y-3 border-l-4 p-4", tone[r.verdict])}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <VerdictBadge v={r.verdict} />
                    <span className="text-xs text-muted-foreground">({r.citation}){r.doc && ` · 一致度 ${(r.score * 100).toFixed(0)}%`}</span>
                  </div>
                  <p className="font-serif leading-relaxed">{r.claim}</p>
                  {r.evidence && (
                    <Link to={`/app/library/${r.doc!.id}?chunk=${r.evidence.id}`} className="block rounded-md bg-muted/60 p-3 text-sm hover:bg-muted">
                      <p className="mb-1 text-xs font-semibold text-muted-foreground">原文の根拠 — {authorLine(r.doc!)}, p.{r.evidence.page}</p>
                      <p className="font-serif leading-relaxed"><span className={r.verdict === "supported" ? "mark-ai" : "mark"}>{r.evidence.content}</span></p>
                    </Link>
                  )}
                  <p className="text-sm text-muted-foreground">{r.note}</p>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
