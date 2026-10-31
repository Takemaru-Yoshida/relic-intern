import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import "@/lib/pdfjs";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Highlighter, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildRanges, extractPages, renderItem, type Mark } from "@/lib/pdf";

type Pages = Awaited<ReturnType<typeof extractPages>>;

interface Props {
  url: string;
  marks: Mark[];
  focus?: { id: string; n: number }; // n を変えると同じ id でも再スクロール
  onText?: (pages: Pages) => void;
  onLocate?: (pageOf: Record<string, number>) => void;
  onSelectText?: (text: string) => void;
}

export default function PdfViewer({ url, marks, focus, onText, onLocate, onSelectText }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [zoom, setZoom] = useState(1);
  const [pages, setPages] = useState<Pages>();
  const [sel, setSel] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(Math.min(900, e.contentRect.width)));
    box.current && ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  const onLoad = async (pdf: PDFDocumentProxy) => {
    const p = await extractPages(pdf);
    setPages(p);
    onText?.(p);
  };

  const { ranges, pageOf } = useMemo(() => (pages ? buildRanges(pages, marks) : { ranges: {}, pageOf: {} }), [pages, marks]);
  useEffect(() => onLocate?.(pageOf), [pageOf, onLocate]);

  // ハイライト位置へスクロール（テキストレイヤー描画後に <mark> を探す）
  useEffect(() => {
    const p = focus && pageOf[focus.id];
    if (!p) return;
    const el = box.current?.querySelector(`[data-page-number="${p}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = setTimeout(() => box.current?.querySelector(`[data-page-number="${p}"] mark.hl-query, [data-page-number="${p}"] mark`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
    return () => clearTimeout(t);
  }, [focus, pageOf]);

  const renderer = useCallback(({ pageIndex, itemIndex, str }: { pageIndex: number; itemIndex: number; str: string }) => renderItem(str, ranges[pageIndex]?.[itemIndex]), [ranges]);

  const onMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    const text = window.getSelection()?.toString().trim() ?? "";
    if (!onSelectText || text.length < 6) return setSel(null);
    const r = box.current!.getBoundingClientRect(), pt = "changedTouches" in e ? e.changedTouches[0] : e;
    setSel({ text, x: pt.clientX - r.left, y: pt.clientY - r.top + box.current!.scrollTop });
  };

  return (
    <div className="relative">
      <div className="sticky top-14 z-10 mb-2 flex items-center justify-end gap-1 lg:top-0">
        <Button variant="outline" size="icon" className="size-8 bg-background" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="縮小"><Minus /></Button>
        <span className="w-12 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="icon" className="size-8 bg-background" onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))} aria-label="拡大"><Plus /></Button>
      </div>
      <div ref={box} onMouseUp={onMouseUp} onTouchEnd={onMouseUp} className="pdf-view relative max-h-[80vh] overflow-auto rounded-lg border bg-muted/60 p-2 sm:p-4">
        <Document file={url} onLoadSuccess={onLoad} loading={<Loading />} error={<p className="p-8 text-center text-sm text-refuted">PDF を読み込めませんでした</p>}>
          {pages?.map((_, i) => (
            <Page key={i} pageNumber={i + 1} width={(width - 32) * zoom} customTextRenderer={renderer} renderAnnotationLayer={false} className="mx-auto mb-4 w-fit shadow-md" loading={<Loading />} />
          ))}
        </Document>
        {sel && (
          <Button size="sm" className="absolute z-20 -translate-x-1/2 shadow-lg" style={{ left: sel.x, top: sel.y + 12 }}
            onMouseUp={(e) => e.stopPropagation()} onClick={() => (onSelectText!(sel.text), setSel(null), window.getSelection()?.removeAllRanges())}>
            <Highlighter />マーカーを引く
          </Button>
        )}
      </div>
    </div>
  );
}

const Loading = () => <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />PDF を読み込み中…</div>;
