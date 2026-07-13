import { PDFDocument, PageSizes, rgb, degrees } from 'pdf-lib';

export type LayoutMode = '4-up' | '2-up' | '1-vertical' | '2-vertical' | '3-vertical' | '4-vertical' | '3.5-vertical';

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

  // A4 Portrait Dimensions for Vertical Layouts
  const A4_PORTRAIT_WIDTH = PageSizes.A4[0]; // 595.28
  const A4_PORTRAIT_HEIGHT = PageSizes.A4[1]; // 841.89

  const isVertical = layout.includes('vertical');

  const margin = 20; // Margin around the entire A4 page
  const spacing = 15; // Spacing between the scaled pages

  if (!isVertical) {
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
  } else {
    // Vertical Layouts
    const pagesPerSheetStr = layout.split('-')[0];
    const rowsPerPage = parseFloat(pagesPerSheetStr);

    // Total vertical space we can print on (without spacing yet, because continuous means no fixed spacing for 3.5, but we requested vertical layout).
    // The user requested stacked vertical: Page 1 on top, page 2 below it, etc.
    // Let's create a continuous canvas for the source pages and then paginate.

    // For normal vertical (1, 2, 3, 4) we just divide the height by rows
    // For 3.5 we divide the height by 3.5.

    // We have a single column.
    const availableWidth = A4_PORTRAIT_WIDTH - (margin * 2);
    // Number of spacing gaps per sheet is Math.ceil(rowsPerPage) - 1. But for continuous like 3.5 it's better to just calculate based on height.
    // To make it simple: let's determine the slot height.
    // If rowsPerPage = 3.5, we have 3 spaces if we consider 4 elements taking up space.
    // Let's use a continuous coordinate system for all pages.

    // Each page gets a scaled version. We'll fit it to the slot width and slot height.
    // Actually, the user wants "3.5 on 1 page", which implies continuous flow.

    // Slot width is availableWidth.
    // If we want exactly `rowsPerPage` pages to fit on one sheet vertically:
    // Let's ignore inter-page spacing for the "3.5" layout logic to ensure perfectly continuous flow, or keep it small.
    // User said "have these all features in it properly". Let's support spacing for normal ones, but maybe standard 0 spacing for continuous?
    // Let's keep spacing consistent.
    const totalSpacing = Math.max(0, Math.ceil(rowsPerPage) - 1) * spacing;
    const slotHeight = (A4_PORTRAIT_HEIGHT - (margin * 2) - totalSpacing) / rowsPerPage;
    const slotWidth = availableWidth;

    // Calculate scaling for each page based on the first page to keep things consistent (assuming all pages are same size)
    // If they aren't, we'll scale each individually.

    let currentYPosOnSheet = A4_PORTRAIT_HEIGHT - margin; // Start from top
    let currentSheet = targetPdf.addPage([A4_PORTRAIT_WIDTH, A4_PORTRAIT_HEIGHT]);

    let pagesOnCurrentSheet = 0;

    for (let i = 0; i < embeddedPages.length; i++) {
      const embeddedPage = embeddedPages[i];
      const srcW = embeddedPage.width;
      const srcH = embeddedPage.height;

      const scaleX = slotWidth / srcW;
      const scaleY = slotHeight / srcH;
      const scale = Math.min(scaleX, scaleY);

      const scaledW = srcW * scale;
      const scaledH = srcH * scale;

      const xOffset = margin + (slotWidth - scaledW) / 2; // Centered

      let remainingHeightToDraw = scaledH;

      // Strict pagination enforcement for non-continuous layouts
      if (layout !== '3.5-vertical' && pagesOnCurrentSheet >= rowsPerPage) {
        currentSheet = targetPdf.addPage([A4_PORTRAIT_WIDTH, A4_PORTRAIT_HEIGHT]);
        currentYPosOnSheet = A4_PORTRAIT_HEIGHT - margin;
        pagesOnCurrentSheet = 0;
      }

      // Draw this page. It might span multiple sheets.
      while (remainingHeightToDraw > 0) {
        // How much space is left on the current sheet?
        const spaceLeftOnSheet = currentYPosOnSheet - margin;

        if (spaceLeftOnSheet <= 0) {
          // Current sheet is full, create a new one
          currentSheet = targetPdf.addPage([A4_PORTRAIT_WIDTH, A4_PORTRAIT_HEIGHT]);
          currentYPosOnSheet = A4_PORTRAIT_HEIGHT - margin;
          pagesOnCurrentSheet = 0;
          continue;
        }

        // The correct position for the bottom of the image should simply be `currentYPosOnSheet - remainingHeightToDraw`.
        // This ensures the already-drawn top portion is pushed above the printable area.
        const bottomY = currentYPosOnSheet - remainingHeightToDraw;

        currentSheet.drawPage(embeddedPage, {
          x: xOffset,
          y: bottomY,
          width: scaledW,
          height: scaledH,
        });

        if (drawBorders) {
          currentSheet.drawRectangle({
            x: xOffset,
            y: bottomY,
            width: scaledW,
            height: scaledH,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 1,
          });
        }

        const drawnThisStep = Math.min(remainingHeightToDraw, spaceLeftOnSheet);
        remainingHeightToDraw -= drawnThisStep;
        currentYPosOnSheet -= drawnThisStep;

        if (remainingHeightToDraw > 0) {
          // We need a new sheet for the rest of this page
          currentSheet = targetPdf.addPage([A4_PORTRAIT_WIDTH, A4_PORTRAIT_HEIGHT]);
          currentYPosOnSheet = A4_PORTRAIT_HEIGHT - margin;
          pagesOnCurrentSheet = 0;
        } else {
          // Page finished. Add spacing before next page.
          currentYPosOnSheet -= spacing;
          pagesOnCurrentSheet++;
        }
      }
    }

    // Draw white rectangles over margins to act as clipping masks
    for (let i = 0; i < targetPdf.getPageCount(); i++) {
      const page = targetPdf.getPage(i);

      // Top margin
      page.drawRectangle({
        x: 0,
        y: A4_PORTRAIT_HEIGHT - margin,
        width: A4_PORTRAIT_WIDTH,
        height: margin,
        color: rgb(1, 1, 1),
      });

      // Bottom margin
      page.drawRectangle({
        x: 0,
        y: 0,
        width: A4_PORTRAIT_WIDTH,
        height: margin,
        color: rgb(1, 1, 1),
      });

      // Left margin
      page.drawRectangle({
        x: 0,
        y: 0,
        width: margin,
        height: A4_PORTRAIT_HEIGHT,
        color: rgb(1, 1, 1),
      });

      // Right margin
      page.drawRectangle({
        x: A4_PORTRAIT_WIDTH - margin,
        y: 0,
        width: margin,
        height: A4_PORTRAIT_HEIGHT,
        color: rgb(1, 1, 1),
      });
    }
  }

  return await targetPdf.save();
}
