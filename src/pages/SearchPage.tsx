import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/misc";
import { PageHeader, Spinner, authorLine } from "@/components/shared";
import { semanticSearch } from "@/lib/api";
import { useAsync } from "@/lib/hooks";

const examples = ["過学習を防ぐ方法", "画像を単語の列として扱う", "深いネットワークを学習させる工夫", "学習率を自動で調整する最適化"];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [q, setQ] = useState(query);
  const { data: hits, loading } = useAsync(() => (query ? semanticSearch(query) : Promise.resolve(null)), [query]);
  const go = (v: string) => (setQ(v), setParams(v ? { q: v } : {}));

  return (
    <>
      <PageHeader title="意味検索" desc="キーワードではなく「意味」で、ライブラリ内の全文献から関連する一節を探します（RAG）。" />
      <form onSubmit={(e) => (e.preventDefault(), go(q))} className="flex gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="知りたいことを文章で入力（日本語・英語）" className="h-12 pl-9 text-base" />
        </div>
        <Button size="lg" className="h-12" disabled={loading && !!query}>{loading && query ? <Loader2 className="animate-spin" /> : <Search />}<span className="hidden sm:inline">検索</span></Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((e) => <Button key={e} variant="outline" size="sm" className="h-7 rounded-full text-xs" onClick={() => go(e)}>{e}</Button>)}
      </div>

      <div className="mt-8">
        {!query ? (
          <p className="py-16 text-center text-sm text-muted-foreground">質問を入力すると、意味の近い一節が類似度順に表示されます。</p>
        ) : loading ? <Spinner label="ベクトル検索中…" /> : !hits?.length ? (
          <p className="py-16 text-center text-sm text-muted-foreground">該当する一節が見つかりませんでした</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{hits.length} 件の一節が見つかりました</p>
            {hits.map(({ chunk, doc, score }) => (
              <Link key={chunk.id} to={`/app/library/${doc.id}?chunk=${chunk.id}`}>
                <Card className="mb-3 space-y-2 p-4 transition hover:border-primary/40 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-sm font-bold tabular-nums text-primary">{(score * 100).toFixed(0)}%</span>
                    <Progress value={score * 100} className="h-1.5 max-w-[140px]" />
                    <span className="ml-auto text-xs text-muted-foreground">{chunk.section} · p.{chunk.page}</span>
                  </div>
                  <p className="font-serif leading-relaxed">{chunk.content}</p>
                  <p className="truncate text-xs text-muted-foreground"><span className="font-medium text-foreground">{doc.title}</span> — {authorLine(doc)}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
