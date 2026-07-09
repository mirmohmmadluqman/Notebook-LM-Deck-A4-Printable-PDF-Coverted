import { PDFDocument, PageSizes, rgb, degrees } from 'pdf-lib';

export type LayoutMode = '4-up' | '2-up';

export interface ProcessPdfOptions {
  file: File;
  layout: LayoutMode;
  drawBorders?: boolean;
}

export async function processPdf({ file, layout, drawBorders = true }: ProcessPdfOptions): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer);

  const targetPdf = await PDFDocument.create();

  // Embed the source pages so they can be drawn onto new pages
  const embeddedPages = await targetPdf.embedPages(sourcePdf.getPages());

  // A4 Landscape Dimensions
  const A4_WIDTH = PageSizes.A4[1]; // 841.89
  const A4_HEIGHT = PageSizes.A4[0]; // 595.28

  // Configuration for Layouts
  let cols, rows;
  if (layout === '4-up') {
    cols = 2;
    rows = 2;
  } else {
    // 2-up layout
    cols = 2;
    rows = 1;
  }

  const pagesPerSheet = cols * rows;
  const numSheets = Math.ceil(embeddedPages.length / pagesPerSheet);

  const margin = 20; // Margin around the entire A4 page
  const spacing = 15; // Spacing between the scaled pages

  // The available area for all columns/rows
  const availableWidth = A4_WIDTH - (margin * 2) - (spacing * (cols - 1));
  const availableHeight = A4_HEIGHT - (margin * 2) - (spacing * (rows - 1));

  // The target bounding box for a single source page
  const slotWidth = availableWidth / cols;
  const slotHeight = availableHeight / rows;

  for (let sheetIndex = 0; sheetIndex < numSheets; sheetIndex++) {
    const page = targetPdf.addPage([A4_WIDTH, A4_HEIGHT]);

    for (let i = 0; i < pagesPerSheet; i++) {
      const sourcePageIndex = sheetIndex * pagesPerSheet + i;
      if (sourcePageIndex >= embeddedPages.length) break;

      const embeddedPage = embeddedPages[sourcePageIndex];
      // Note: scale method from embeddedPage gives the actual dimensions.
      // getSize() is available on PDFPage but for embedded we can use width/height properties
      const srcW = embeddedPage.width;
      const srcH = embeddedPage.height;

      // Calculate uniform scale to fit into the slot while preserving aspect ratio
      const scaleX = slotWidth / srcW;
      const scaleY = slotHeight / srcH;
      const scale = Math.min(scaleX, scaleY);

      const scaledW = srcW * scale;
      const scaledH = srcH * scale;

      // Determine Grid Position
      // 4-up (2x2):
      // [0, 1]
      // [2, 3]
      // 2-up (2x1):
      // [0, 1]
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Center the scaled page inside its slot
      const xOffset = margin + col * (slotWidth + spacing) + (slotWidth - scaledW) / 2;
      // Y is from bottom-up in pdf-lib. So row 0 is top.
      const yOffset = A4_HEIGHT - margin - (row * (slotHeight + spacing)) - slotHeight + (slotHeight - scaledH) / 2;

      page.drawPage(embeddedPage, {
        x: xOffset,
        y: yOffset,
        width: scaledW,
        height: scaledH,
      });

      if (drawBorders) {
        page.drawRectangle({
          x: xOffset,
          y: yOffset,
          width: scaledW,
          height: scaledH,
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1,
        });
      }
    }
  }

  return await targetPdf.save();
}
