import { test } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';

test('create dummy pdf', async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 500]);
    page.drawText('Dummy PDF for Testing');
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('/tmp/dummy3.pdf', pdfBytes);
});
