import { useMemo, useRef, useState } from "react";
import { FileUp, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/misc";
import { DocCard, PageHeader, Spinner } from "@/components/shared";
import { listDocuments, uploadDocument } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Doc } from "@/lib/types";

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
        <DialogDescription>PDF をアップロードすると、本文の分割・ベクトル化・重要文の抽出が自動で行われます。</DialogDescription>
        <button
          type="button" onClick={() => ref.current?.click()}
          onDragOver={(e) => (e.preventDefault(), setDrag(true))} onDragLeave={() => setDrag(false)}
          onDrop={(e) => (e.preventDefault(), setDrag(false), add(e.dataTransfer.files))}
          className={cn("flex flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-sm text-muted-foreground transition", drag && "border-primary bg-secondary")}
        >
          <FileUp className="size-8 text-primary" />
          <span>ここに PDF をドロップ、またはクリックして選択</span>
          <input ref={ref} type="file" accept="application/pdf" multiple hidden onChange={(e) => add(e.target.files)} />
        </button>
        {files.length > 0 && <ul className="max-h-32 space-y-1 overflow-auto text-sm">{files.map((f, i) => <li key={i} className="truncate">📄 {f.name}</li>)}</ul>}
        {progress !== null && <Progress value={progress} />}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Input placeholder="または DOI / arXiv ID を入力" className="sm:mr-auto sm:max-w-[220px]" />
          <Button disabled={!files.length || progress !== null} onClick={submit}>アップロード</Button>
        </div>
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
