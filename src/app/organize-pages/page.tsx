'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadCloud, File as FileIcon, Download, Loader2, Info, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function OrganizePagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<{ id: string; originalIndex: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      await loadPdfPages(selectedFile);
    } else {
      setFile(null);
      setPages([]);
      setError('Please select a valid PDF file.');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      await loadPdfPages(droppedFile);
    } else {
      setError('Please drop a valid PDF file.');
    }
  };

  const loadPdfPages = async (selectedFile: File) => {
    try {
      setIsProcessing(true);
      setError(null);

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const pageCount = pdf.getPageCount();

      const initialPages = Array.from({ length: pageCount }, (_, i) => ({
        id: `page-${i}-${Date.now()}`,
        originalIndex: i
      }));

      setFile(selectedFile);
      setPages(initialPages);
    } catch (err) {
      console.error(err);
      setError('Could not read the PDF file.');
      setFile(null);
      setPages([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[index - 1];
    newPages[index - 1] = temp;
    setPages(newPages);
  };

  const moveDown = (index: number) => {
    if (index === pages.length - 1) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[index + 1];
    newPages[index + 1] = temp;
    setPages(newPages);
  };

  const removePage = (index: number) => {
    setPages(pages.filter((_, i) => i !== index));
  };

  const handleOrganize = async () => {
    if (!file) return;
    if (pages.length === 0) {
      setError('No pages left to organize.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);

      const organizedPdf = await PDFDocument.create();
      const pageIndicesToCopy = pages.map(p => p.originalIndex);

      const copiedPages = await organizedPdf.copyPages(sourcePdf, pageIndicesToCopy);
      copiedPages.forEach((page) => organizedPdf.addPage(page));

      const pdfBytes = await organizedPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `organized_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('An error occurred while organizing the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-3xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b pb-6 text-center sm:text-left">
        <h1 className="text-4xl font-bold text-gray-900">Organize Pages</h1>
        <p className="text-lg text-gray-600">
          Reorder, delete, or extract specific pages.
        </p>
      </header>

      <div className="flex-1 flex flex-col gap-8">
        {/* Upload Section */}
        <section>
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

        {/* Organize Section */}
        {pages.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Organize Pages</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pages.map((page, index) => (
                <div key={page.id} className="relative flex flex-col items-center gap-2 p-3 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removePage(index)}
                      className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-full"
                      title="Remove Page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-full aspect-[1/1.4] bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                    <span className="text-2xl font-bold text-gray-300">{page.originalIndex + 1}</span>
                  </div>
                  <div className="flex w-full items-center justify-between">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-gray-700">Pg {page.originalIndex + 1}</span>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === pages.length - 1}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action Section */}
        <section className="pt-4 border-t">
          <button
            onClick={handleOrganize}
            disabled={!file || pages.length === 0 || isProcessing}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-medium transition-colors
              ${!file || pages.length === 0
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
                Download Organized PDF
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
