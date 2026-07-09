'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, LayoutGrid, Columns, Download, Loader2, Info } from 'lucide-react';
import { processPdf, LayoutMode } from '@/lib/pdf';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [layout, setLayout] = useState<LayoutMode>('4-up');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawBorders, setDrawBorders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid PDF file.');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a valid PDF file.');
    }
  };

  const handleGenerate = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const pdfBytes = await processPdf({ file, layout, drawBorders });

      // Create a blob and trigger download
      // Note: pdf-lib returns a Uint8Array, we wrap it properly for Blob to avoid TS errors
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace('.pdf', '')}_${layout}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('An error occurred while processing the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-3xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b pb-6 text-center sm:text-left">
        <h1 className="text-4xl font-bold text-gray-900">PDF Imposition Tool</h1>
        <p className="text-lg text-gray-600">
          Easily convert your NotebookLM PDFs (or any PDF) into a printable A4 layout.
        </p>
      </header>

      <div className="flex-1 flex flex-col gap-8">
        {/* Upload Section */}
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Upload PDF</h2>
          <div
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
              ${file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <FileIcon className="w-8 h-8" />
                </div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-gray-100 text-gray-500 rounded-full">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">Only PDF files are supported</p>
              </div>
            )}
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </section>

        {/* Configuration Section */}
        <section className={`transition-opacity ${file ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <h2 className="text-xl font-semibold mb-3">2. Layout Options</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <button
              onClick={() => setLayout('4-up')}
              className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all
                ${layout === '4-up' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <LayoutGrid className={`w-8 h-8 ${layout === '4-up' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="text-center">
                <p className="font-medium">4 Pages per Sheet</p>
                <p className="text-sm text-gray-500">2×2 Grid on A4 Landscape</p>
              </div>
            </button>
            <button
              onClick={() => setLayout('2-up')}
              className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all
                ${layout === '2-up' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <Columns className={`w-8 h-8 ${layout === '2-up' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="text-center">
                <p className="font-medium">2 Pages per Sheet</p>
                <p className="text-sm text-gray-500">Side-by-side on A4 Landscape</p>
              </div>
            </button>
          </div>

          <h3 className="text-md font-semibold mb-2">Vertical Layouts (A4 Portrait)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(['1-vertical', '2-vertical', '3-vertical', '4-vertical', '3.5-vertical'] as LayoutMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLayout(mode)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all
                  ${layout === mode ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
              >
                {mode === '3.5-vertical' ? '3.5 Pages Continuous' : `${mode.split('-')[0]} Page(s) Vertical`}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="drawBorders"
              checked={drawBorders}
              onChange={(e) => setDrawBorders(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="drawBorders" className="text-gray-700">Add visible borders/cut guides</label>
          </div>
        </section>

        {/* Action Section */}
        <section className="pt-4 border-t">
          <button
            onClick={handleGenerate}
            disabled={!file || isProcessing}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-medium transition-colors
              ${!file
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing PDF...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                Download Printable PDF
              </>
            )}
          </button>
          <div className="mt-4 flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            <Info className="w-5 h-5 flex-shrink-0 text-blue-500" />
            <p>100% Secure. All PDF processing happens directly in your browser. No files are uploaded to any server.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
