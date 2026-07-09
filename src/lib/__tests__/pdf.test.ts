import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { processPdf } from '../pdf';

describe('PDF Processing Logic', () => {
  it('should generate a 4-up PDF with correct page counts', async () => {
    // Create a dummy PDF with 5 pages
    const dummyPdf = await PDFDocument.create();
    for (let i = 0; i < 5; i++) {
      const page = dummyPdf.addPage([500, 500]);
      page.drawText('Test page ' + i, { x: 50, y: 50 });
    }
    const dummyPdfBytes = await dummyPdf.save();

    // Mock the File object
    const file = new File([dummyPdfBytes], 'test.pdf', { type: 'application/pdf' });

    // Process with 4-up layout
    const resultBytes = await processPdf({ file, layout: '4-up' });

    // Load the result
    const resultPdf = await PDFDocument.load(resultBytes);

    // 5 pages at 4-up should result in 2 pages (Math.ceil(5 / 4))
    expect(resultPdf.getPageCount()).toBe(2);
  });

  it('should generate a 2-up PDF with correct page counts', async () => {
    // Create a dummy PDF with 5 pages
    const dummyPdf = await PDFDocument.create();
    for (let i = 0; i < 5; i++) {
      const page = dummyPdf.addPage([500, 500]);
      page.drawText('Test page ' + i, { x: 50, y: 50 });
    }
    const dummyPdfBytes = await dummyPdf.save();

    // Mock the File object
    const file = new File([dummyPdfBytes], 'test.pdf', { type: 'application/pdf' });

    // Process with 2-up layout
    const resultBytes = await processPdf({ file, layout: '2-up' });

    // Load the result
    const resultPdf = await PDFDocument.load(resultBytes);

    // 5 pages at 2-up should result in 3 pages (Math.ceil(5 / 2))
    expect(resultPdf.getPageCount()).toBe(3);
  });
});
