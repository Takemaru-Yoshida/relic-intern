// デモ用：モック文献の本文から PDF をブラウザ内で生成する（本番では Storage の実 PDF を使う）
import type { Chunk, Doc } from "./types";

export async function makeSamplePdf(doc: Doc, chunks: Chunk[]) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const [f, fb, fi] = await Promise.all([StandardFonts.TimesRoman, StandardFonts.TimesRomanBold, StandardFonts.TimesRomanItalic].map((s) => pdf.embedFont(s)));
  const W = 612, M = 72;
  let page = pdf.addPage([W, 792]), y = 720;
  const write = (text: string, font = f, size = 11, lh = size * 1.45, x = M) => {
    const words = text.split(" ");
    let line = "";
    const flush = () => {
      if (y < M) (page = pdf.addPage([W, 792])), (y = 720);
      page.drawText(line, { x, y, size, font, color: rgb(0.1, 0.1, 0.12) });
      y -= lh; line = "";
    };
    for (const w of words) {
      if (font.widthOfTextAtSize(line + " " + w, size) > W - x - M) flush();
      line = line ? `${line} ${w}` : w;
    }
    line && flush();
  };
  write(doc.title, fb, 17, 22);
  y -= 4;
  write(doc.authors.join(", "), f, 11);
  write(`${doc.venue} (${doc.year})${doc.doi ? `  doi:${doc.doi}` : ""}`, fi, 10);
  y -= 14;
  chunks.forEach((c, i) => {
    if (c.section !== chunks[i - 1]?.section) (y -= 8), write(c.section, fb, 12, 18);
    write(c.content);
    y -= 6;
  });
  page.drawText("DocMeg demo PDF - content paraphrased for demonstration", { x: M, y: 40, size: 8, font: fi, color: rgb(0.5, 0.5, 0.5) });
  return URL.createObjectURL(new Blob([(await pdf.save()) as BlobPart], { type: "application/pdf" }));
}
