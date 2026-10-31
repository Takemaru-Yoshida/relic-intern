import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, CircleHelp, FileText, Highlighter, Loader2, Star, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Doc, Verdict } from "@/lib/types";

export const Logo = ({ className }: { className?: string }) => (
  <Link to="/" className={cn("flex items-center gap-2 font-bold tracking-tight", className)}>
    <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
      <Highlighter className="size-4" />
    </span>
    <span className="text-lg">Doc<span className="relative before:absolute before:inset-x-0 before:bottom-0.5 before:-z-10 before:h-2 before:bg-marker">Meg</span></span>
  </Link>
);

export const verdictMeta: Record<Verdict, { label: string; icon: typeof CheckCircle2; variant: "verified" | "partial" | "refuted" | "secondary" }> = {
  supported: { label: "支持", icon: CheckCircle2, variant: "verified" },
  partial: { label: "一部支持", icon: AlertTriangle, variant: "partial" },
  refuted: { label: "矛盾", icon: XCircle, variant: "refuted" },
  not_found: { label: "文献なし", icon: CircleHelp, variant: "secondary" },
};

export const VerdictBadge = ({ v }: { v: Verdict }) => {
  const { label, icon: Icon, variant } = verdictMeta[v];
  return <Badge variant={variant}><Icon className="size-3.5" />{label}</Badge>;
};

export const authorLine = (d: Doc) => (!d.authors.length ? "著者不明" : d.authors.length > 2 ? `${d.authors[0]} ほか` : d.authors.join(", ")) + (d.year ? ` (${d.year})` : "");

export const DocCard = ({ doc }: { doc: Doc }) => (
  <Link to={`/app/library/${doc.id}`}>
    <Card className="group flex h-full gap-3 p-4 transition hover:border-primary/40 hover:shadow-md">
      <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
        {doc.status === "processing" ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug group-hover:text-primary">{doc.title}</h3>
          {doc.starred && <Star className="size-4 shrink-0 fill-partial text-partial" />}
        </div>
        <p className="truncate text-xs text-muted-foreground">{authorLine(doc)} · {doc.venue}</p>
        <div className="flex flex-wrap gap-1">
          {doc.status === "processing" && <Badge variant="partial">解析中</Badge>}
          {doc.tags.map((t) => <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>)}
        </div>
      </div>
    </Card>
  </Link>
);

export const PageHeader = ({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
    </div>
    {children && <div className="flex gap-2">{children}</div>}
  </div>
);

export const Spinner = ({ label = "読み込み中…" }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{label}</div>
);
