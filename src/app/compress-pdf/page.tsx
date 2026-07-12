'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, Download, Loader2, Info, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function CompressPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = Array.from(e.target.files).find(file => file.type === 'application/pdf');
      if (selectedFile) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid PDF file.');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFile = Array.from(e.dataTransfer.files).find(file => file.type === 'application/pdf');
      if (droppedFile) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Please drop a valid PDF file.');
      }
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('An error occurred while compressing the document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-3xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b pb-6 text-center sm:text-left">
        <h1 className="text-4xl font-bold text-gray-900">Compress PDF</h1>
        <p className="text-lg text-gray-600">
          Optimize your PDF file size by rebuilding the document.
        </p>
      </header>

      <div className="flex-1 flex flex-col gap-8">
        {/* Upload Section */}
        <section>
          <div
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
              ${file ? 'border-gray-300 hover:border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm w-full">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                    <span className="truncate font-medium text-gray-700">{file.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
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

        {/* Action Section */}
        <section className="pt-4 border-t">
          <button
            onClick={handleCompress}
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
                Compress & Download PDF
              </>
            )}
          </button>
          <div className="mt-4 flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            <Info className="w-5 h-5 flex-shrink-0 text-blue-500" />
            <p>Note: Since this tool runs completely locally in your browser, compression simply rebuilds the PDF to strip unreferenced objects. To heavily downsample images, specialized server-side tools are usually required.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
