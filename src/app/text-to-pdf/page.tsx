'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, Info } from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export default function TextToPdfPage() {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!text.trim()) {
      setError('Please enter some text to convert.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const margin = 50;

      let page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      let y = height - margin;

      const lines = text.split('\n');

      for (const line of lines) {
        // Basic word wrap
        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > width - 2 * margin) {
            page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
            y -= fontSize + 4;
            currentLine = word;

            if (y < margin) {
              page = pdfDoc.addPage();
              y = height - margin;
            }
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
          y -= fontSize + 4;

          if (y < margin) {
            page = pdfDoc.addPage();
            y = height - margin;
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `converted_text.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('An error occurred while converting text to PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-3xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b pb-6 text-center sm:text-left">
        <h1 className="text-4xl font-bold text-gray-900">Text to PDF</h1>
        <p className="text-lg text-gray-600">
          Create a PDF document from raw text.
        </p>
      </header>

      <div className="flex-1 flex flex-col gap-8">
        <section>
          <div className="flex flex-col gap-3">
            <label htmlFor="textContent" className="font-medium text-gray-900">
              Enter your text here:
            </label>
            <textarea
              id="textContent"
              rows={15}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y font-mono text-sm"
              placeholder="Type or paste your text here..."
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </section>

        <section className="pt-4 border-t">
          <button
            onClick={handleConvert}
            disabled={!text.trim() || isProcessing}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-medium transition-colors
              ${!text.trim()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                Download PDF
              </>
            )}
          </button>
          <div className="mt-4 flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            <Info className="w-5 h-5 flex-shrink-0 text-blue-500" />
            <p>100% Secure. Processing happens directly in your browser.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
