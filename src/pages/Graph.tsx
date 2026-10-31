import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch, Label } from "@/components/ui/misc";
import { PageHeader, Spinner, authorLine } from "@/components/shared";
import { getGraph } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import type { Doc, GraphEdge } from "@/lib/types";

const W = 800, H = 560;
const palette = ["#2f4a9a", "#0f8a6a", "#c2410c", "#9333ea", "#0e7490", "#be185d", "#a16207", "#4d7c0f"];

// 簡易フォースレイアウト（反発 + ばね + 中心引力）
function layout(docs: Doc[], edges: GraphEdge[]) {
  const p = Object.fromEntries(docs.map((d, i) => [d.id, { x: W / 2 + 200 * Math.cos(i * 2.4), y: H / 2 + 180 * Math.sin(i * 2.4) }]));
  for (let it = 0; it < 300; it++) {
    for (const a of docs) for (const b of docs) {
      if (a === b) continue;
      const dx = p[a.id].x - p[b.id].x, dy = p[a.id].y - p[b.id].y, d2 = dx * dx + dy * dy + 0.01;
      p[a.id].x += (dx / d2) * 300; p[a.id].y += (dy / d2) * 300;
    }
    for (const e of edges) {
      const a = p[e.source], b = p[e.target], dx = b.x - a.x, dy = b.y - a.y, f = 0.01 * e.weight;
      a.x += dx * f; a.y += dy * f; b.x -= dx * f; b.y -= dy * f;
    }
    for (const d of docs) {
      const q = p[d.id];
      q.x += (W / 2 - q.x) * 0.01; q.y += (H / 2 - q.y) * 0.01;
      q.x = Math.max(60, Math.min(W - 60, q.x)); q.y = Math.max(40, Math.min(H - 40, q.y));
    }
  }
  return p;
}

export default function Graph() {
  const [params] = useSearchParams();
  const { data, loading } = useAsync(getGraph);
  const [sel, setSel] = useState<string | null>(params.get("focus"));
  const [show, setShow] = useState({ cites: true, similar: true });
  const pos = useMemo(() => data && layout(data.docs, data.edges), [data]);
  const tags = useMemo(() => [...new Set(data?.docs.map((d) => d.tags[0]))], [data]);

  if (loading || !data || !pos) return <Spinner />;
  const edges = data.edges.filter((e) => show[e.kind]);
  const nb = new Set(sel ? edges.flatMap((e) => (e.source === sel ? [e.target] : e.target === sel ? [e.source] : [])) : []);
  const doc = data.docs.find((d) => d.id === sel);
  const color = (d: Doc) => palette[tags.indexOf(d.tags[0]) % palette.length];
  const deg = (id: string) => data.edges.filter((e) => e.source === id || e.target === id).length;

  return (
    <>
      <PageHeader title="関連グラフ" desc="引用関係（実線）と内容の近さ（点線）から文献同士のつながりを可視化します。ノードを選ぶと関連文献が強調されます。" />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 border-b p-3 text-sm">
            {(["cites", "similar"] as const).map((k) => (
              <div key={k} className="flex items-center gap-2">
                <Switch id={k} checked={show[k]} onCheckedChange={(v) => setShow((s) => ({ ...s, [k]: v }))} />
                <Label htmlFor={k}>{k === "cites" ? "引用関係" : "内容の類似"}</Label>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {tags.map((t, i) => <span key={t} className="flex items-center gap-1 text-xs text-muted-foreground"><i className="size-2.5 rounded-full" style={{ background: palette[i % palette.length] }} />{t}</span>)}
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="aspect-[10/7] w-full touch-manipulation bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:20px_20px]" onClick={() => setSel(null)}>
            <defs><marker id="arr" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#64748b" /></marker></defs>
            {edges.map((e, i) => {
              const a = pos[e.source], b = pos[e.target], on = !sel || e.source === sel || e.target === sel;
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#64748b" strokeOpacity={on ? 0.7 : 0.1} strokeWidth={e.kind === "cites" ? 1.6 : 1.2} strokeDasharray={e.kind === "similar" ? "4 4" : undefined} markerEnd={e.kind === "cites" ? "url(#arr)" : undefined} />;
            })}
            {data.docs.map((d) => {
              const { x, y } = pos[d.id], r = 9 + 2.5 * deg(d.id), dim = sel && sel !== d.id && !nb.has(d.id);
              return (
                <g key={d.id} transform={`translate(${x},${y})`} opacity={dim ? 0.25 : 1} className="cursor-pointer" onClick={(e) => (e.stopPropagation(), setSel(d.id))}>
                  <circle r={r} fill={color(d)} stroke={sel === d.id ? "#facc15" : "#fff"} strokeWidth={sel === d.id ? 4 : 2} />
                  <text y={r + 16} textAnchor="middle" fontSize="15" fill="currentColor" className="pointer-events-none select-none">{d.authors[0].split(" ").pop()} {d.year}</text>
                </g>
              );
            })}
          </svg>
        </Card>

        <Card className="lg:self-start">
          <CardContent className="space-y-3 p-5">
            {doc ? (
              <>
                <div className="flex flex-wrap gap-1">{doc.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
                <h3 className="font-serif font-semibold leading-snug">{doc.title}</h3>
                <p className="text-xs text-muted-foreground">{authorLine(doc)} · {doc.venue}</p>
                <p className="text-sm leading-relaxed">{doc.abstract}</p>
                <div className="space-y-1 border-t pt-3">
                  <p className="text-xs font-semibold text-muted-foreground">つながっている文献（{nb.size}）</p>
                  {[...nb].map((id) => {
                    const d = data.docs.find((x) => x.id === id)!;
                    const e = edges.find((x) => (x.source === sel && x.target === id) || (x.target === sel && x.source === id))!;
                    return (
                      <button key={id} onClick={() => setSel(id)} className="block w-full rounded p-1.5 text-left text-sm hover:bg-muted">
                        <span className="line-clamp-1">{d.title}</span>
                        <span className="text-xs text-muted-foreground">{e.kind === "cites" ? (e.source === sel ? "→ 引用している" : "← 引用されている") : "≈ 内容が近い"}</span>
                      </button>
                    );
                  })}
                </div>
                <Button size="sm" className="w-full" asChild><Link to={`/app/library/${doc.id}`}>文献を開く<ArrowRight /></Link></Button>
              </>
            ) : <p className="py-6 text-center text-sm text-muted-foreground">ノードを選択すると<br />文献の詳細と関連が表示されます</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
