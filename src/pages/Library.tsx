import { useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileUp, Link2, Loader2, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/misc";
import { DocCard, PageHeader, Spinner, authorLine } from "@/components/shared";
import { addDocuments, findByDoi, lookupDoi, parseIds } from "@/lib/doi";
import { listDocuments, uploadDocument } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Doc } from "@/lib/types";

type Row = { raw: string; doi: string | null; state: "loading" | "ok" | "dup" | "invalid" | "error"; doc?: Doc };
const sampleIds = ["10.1162/neco.1997.9.8.1735", "10.1038/323533a0", "arXiv:1312.6114", "10.1038/nature16961", "10.1109/CVPR.2016.90"];
const rowNote: Record<Row["state"], string> = { loading: "取得中…", ok: "", dup: "ライブラリに登録済み", invalid: "DOI / arXiv ID の形式ではありません", error: "見つかりませんでした" };

function DoiImport({ onDone }: { onDone: (d: Doc[]) => void }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const ok = rows.filter((r) => r.state === "ok");

  const lookup = () => {
    const init: Row[] = parseIds(text).map(({ raw, doi }) => ({ raw, doi, state: !doi ? "invalid" : findByDoi(doi) ? "dup" : "loading", doc: doi ? findByDoi(doi) : undefined }));
    setRows(init);
    init.forEach((r, i) => r.state === "loading" && lookupDoi(r.doi!)
      .then((doc) => ({ state: "ok" as const, doc }), () => ({ state: "error" as const, doc: undefined }))
      .then((u) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, ...u } : x)))));
  };

  return (
    <div className="space-y-3">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[96px] font-mono text-xs"
        placeholder={"1 行に 1 つ（カンマ・空白区切りも可）\n10.1109/CVPR.2016.90\nhttps://doi.org/10.1038/nature14539\narXiv:1706.03762"} />
      <div className="flex items-center justify-between gap-2">
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setText(sampleIds.join("\n"))}>サンプルを入れる</Button>
        <Button variant="outline" size="sm" disabled={!text.trim()} onClick={lookup}><Search />書誌情報を取得</Button>
      </div>
      {rows.length > 0 && (
        <ul className="max-h-56 space-y-1.5 overflow-auto">
          {rows.map((r) => (
            <li key={r.raw} className="flex items-start gap-2 rounded-md border p-2 text-sm">
              {r.state === "loading" ? <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" />
                : r.state === "ok" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-verified" />
                : <AlertCircle className={cn("mt-0.5 size-4 shrink-0", r.state === "dup" ? "text-partial" : "text-refuted")} />}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium leading-snug">{r.doc?.title ?? r.raw}</p>
                <p className="truncate text-xs text-muted-foreground">{r.doc && r.state === "ok" ? `${authorLine(r.doc)} · ${r.doc.venue}` : `${r.doi ?? r.raw} — ${rowNote[r.state]}`}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end">
        <Button disabled={!ok.length || rows.some((r) => r.state === "loading")} onClick={() => (addDocuments(ok.map((r) => r.doc!)), onDone(ok.map((r) => r.doc!)), setRows([]), setText(""))}>
          {ok.length ? `${ok.length} 件を追加` : "追加"}
        </Button>
      </div>
    </div>
  );
}

export function UploadDialog({ onUploaded }: { onUploaded?: (d: Doc) => void }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const add = (l: FileList | null) => l && setFiles((f) => [...f, ...[...l].filter((x) => x.type === "application/pdf")]);

  const submit = async () => {
    setProgress(10);
    for (const [i, f] of files.entries()) {
      onUploaded?.(await uploadDocument(f));
      setProgress(10 + (90 * (i + 1)) / files.length);
    }
    setTimeout(() => (setOpen(false), setFiles([]), setProgress(null)), 400);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Upload />文献を追加</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle>文献を追加</DialogTitle>
        <Tabs defaultValue="pdf">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf"><FileUp />PDF</TabsTrigger>
            <TabsTrigger value="doi"><Link2 />DOI・arXiv ID</TabsTrigger>
          </TabsList>
          <TabsContent value="pdf" className="space-y-3">
            <DialogDescription>PDF をアップロードすると、本文の分割・ベクトル化・重要文の抽出が自動で行われます。</DialogDescription>
            <button
              type="button" onClick={() => ref.current?.click()}
              onDragOver={(e) => (e.preventDefault(), setDrag(true))} onDragLeave={() => setDrag(false)}
              onDrop={(e) => (e.preventDefault(), setDrag(false), add(e.dataTransfer.files))}
              className={cn("flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-sm text-muted-foreground transition", drag && "border-primary bg-secondary")}
            >
              <FileUp className="size-8 text-primary" />
              <span>ここに PDF をドロップ、またはクリックして選択</span>
              <input ref={ref} type="file" accept="application/pdf" multiple hidden onChange={(e) => add(e.target.files)} />
            </button>
            {files.length > 0 && <ul className="max-h-32 space-y-1 overflow-auto text-sm">{files.map((f, i) => <li key={i} className="truncate">📄 {f.name}</li>)}</ul>}
            {progress !== null && <Progress value={progress} />}
            <div className="flex justify-end"><Button disabled={!files.length || progress !== null} onClick={submit}>アップロード</Button></div>
          </TabsContent>
          <TabsContent value="doi" className="space-y-3">
            <DialogDescription>DOI や arXiv ID から書誌情報（タイトル・著者・年・掲載誌・アブストラクト）を取得して追加します。複数まとめて入力できます。</DialogDescription>
            <DoiImport onDone={(list) => (list.forEach((d) => onUploaded?.(d)), setOpen(false))} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function Library() {
  const { data: docs, loading, setData } = useAsync(listDocuments);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const tags = useMemo(() => [...new Set(docs?.flatMap((d) => d.tags))], [docs]);
  const shown = docs?.filter((d) => (!tag || d.tags.includes(tag)) && `${d.title} ${d.authors.join(" ")} ${d.venue}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="ライブラリ" desc={`${docs?.length ?? 0} 件の文献`}>
        <UploadDialog onUploaded={(d) => setData((p) => [d, ...(p ?? []).filter((x) => x.id !== d.id)])} />
      </PageHeader>
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="タイトル・著者・掲載誌で絞り込み" className="pl-9" />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {[null, ...tags].map((t) => (
            <button key={t ?? "all"} onClick={() => setTag(t)}>
              <Badge variant={tag === t ? "default" : "outline"} className="whitespace-nowrap">{t ?? "すべて"}</Badge>
            </button>
          ))}
        </div>
      </div>
      {loading ? <Spinner /> : shown!.length ? (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">{shown!.map((d) => <DocCard key={d.id} doc={d} />)}</div>
      ) : <p className="py-16 text-center text-sm text-muted-foreground">該当する文献がありません</p>}
    </>
  );
}
