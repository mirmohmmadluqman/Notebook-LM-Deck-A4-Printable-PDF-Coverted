'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, Download, Loader2, Info, Trash2, Image as ImageIcon } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function SignPdfPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = Array.from(e.target.files).find(f => f.type === 'application/pdf');
      if (selectedFile) {
        setPdfFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid PDF file.');
      }
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = Array.from(e.target.files).find(f =>
        f.type === 'image/jpeg' || f.type === 'image/png'
      );
      if (selectedFile) {
        setSignatureFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a valid signature image (JPG or PNG).');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFile = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf');
      if (droppedFile) {
        setPdfFile(droppedFile);
        setError(null);
      } else {
        setError('Please drop a valid PDF file.');
      }
    }
  };

  const handleSignatureDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFile = Array.from(e.dataTransfer.files).find(f =>
        f.type === 'image/jpeg' || f.type === 'image/png'
      );
      if (droppedFile) {
        setSignatureFile(droppedFile);
        setError(null);
      } else {
        setError('Please drop a valid image file.');
      }
    }
  };

  const handleSign = async () => {
    if (!pdfFile || !signatureFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const pdfArrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);

      const sigArrayBuffer = await signatureFile.arrayBuffer();
      let signatureImage;
      if (signatureFile.type === 'image/png') {
        signatureImage = await pdfDoc.embedPng(sigArrayBuffer);
      } else {
        signatureImage = await pdfDoc.embedJpg(sigArrayBuffer);
      }

      const pages = pdfDoc.getPages();
      if (pages.length > 0) {
        const firstPage = pages[0];
        const { height } = firstPage.getSize();

        // Scale the image down for signature
        const scaledDims = signatureImage.scale(0.25);

        firstPage.drawImage(signatureImage, {
          x: 50,
          y: 50,
          width: scaledDims.width,
          height: scaledDims.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `signed_${pdfFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('An error occurred while signing the document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-3xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b pb-6 text-center sm:text-left">
        <h1 className="text-4xl font-bold text-gray-900">Sign PDF</h1>
        <p className="text-lg text-gray-600">
          Upload a signature image to add to your document.
        </p>
      </header>

      <div className="flex-1 flex flex-col gap-8">
        {/* PDF Upload Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">1. Select Document</h2>
          <div
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
              ${pdfFile ? 'border-gray-300 hover:border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
            onDragOver={handleDragOver}
            onDrop={handlePdfDrop}
            onClick={() => !pdfFile && pdfInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              ref={pdfInputRef}
              onChange={handlePdfChange}
            />
            {pdfFile ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm w-full">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                  <span className="truncate font-medium text-gray-700">{pdfFile.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPdfFile(null);
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="font-medium text-gray-900">Upload PDF</p>
              </div>
            )}
          </div>
        </section>

        {/* Signature Upload Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">2. Select Signature Image</h2>
          <div
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
              ${signatureFile ? 'border-gray-300 hover:border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
            onDragOver={handleDragOver}
            onDrop={handleSignatureDrop}
            onClick={() => !signatureFile && signatureInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="hidden"
              ref={signatureInputRef}
              onChange={handleSignatureChange}
            />
            {signatureFile ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm w-full">
                <div className="flex items-center gap-3 overflow-hidden">
                  <ImageIcon className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                  <span className="truncate font-medium text-gray-700">{signatureFile.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSignatureFile(null);
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="font-medium text-gray-900">Upload Signature (JPG/PNG)</p>
              </div>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </section>

        {/* Action Section */}
        <section className="pt-4 border-t">
          <button
            onClick={handleSign}
            disabled={!pdfFile || !signatureFile || isProcessing}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-medium transition-colors
              ${!pdfFile || !signatureFile
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Signing PDF...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                Sign & Download PDF
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
