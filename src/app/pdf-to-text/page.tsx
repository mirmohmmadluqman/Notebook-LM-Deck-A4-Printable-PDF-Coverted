'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, FileText, Loader2, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure the worker explicitly for Next.js 15 + Turbopack environment
// Use a fixed stable CDN URL to ensure it exists.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

export default function PdfToTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setExtractedText('');
      setSuccess(false);
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
      setExtractedText('');
      setSuccess(false);
    } else {
      setError('Please drop a valid PDF file.');
    }
  };

  const extractTextNative = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    return fullText;
  };

  const performOcr = async (file: File) => {
    // For OCR, we need to render the PDF pages to canvas and then pass image data to Tesseract.
    // For a 100% client-side implementation, we will use pdf.js to render it to a canvas.
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 for better OCR quality

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        const dataUrl = canvas.toDataURL('image/png');

        // Pass dataURL to tesseract
        const result = await Tesseract.recognize(dataUrl, 'eng');
        fullText += `--- Page ${i} ---\n${result.data.text}\n\n`;
    }

    return fullText;
  };

  const handleAction = async (action: 'extract' | 'ocr' | 'both') => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(false);
    setExtractedText('');

    try {
      if (action === 'ocr') {
        const text = await performOcr(file);
        setExtractedText(text);
        setSuccess(true);
      } else if (action === 'both') {
        const nativeText = await extractTextNative(file);
        const ocrText = await performOcr(file);
        setExtractedText(`=== Native Text Extraction ===\n\n${nativeText}\n\n=== OCR Extraction ===\n\n${ocrText}`);
        setSuccess(true);
      } else {
        // Native text extraction
        const text = await extractTextNative(file);
        if (text.trim() === '') {
            setError('No text could be extracted from this PDF. It might be composed entirely of images. You would need OCR to extract text from it.');
        } else {
            setExtractedText(text);
            setSuccess(true);
        }
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during text extraction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText);
    alert('Text copied to clipboard!');
  };

  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-4xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b pb-6 text-center sm:text-left">
        <h1 className="text-4xl font-bold text-gray-900">PDF to Text</h1>
        <p className="text-lg text-gray-600">
          Extract text from your PDF documents natively or using OCR.
        </p>
      </header>

      <div className="flex-1 flex flex-col gap-8">
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
          {error && (
             <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-start gap-3 border border-yellow-200">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
             </div>
          )}
        </section>

        <section className={`transition-opacity ${file ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <h2 className="text-xl font-semibold mb-4">Choose Extraction Method</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <button
                onClick={() => handleAction('extract')}
                disabled={!file || isProcessing}
                className="flex flex-col items-center gap-3 p-4 border rounded-xl bg-white hover:border-blue-500 hover:shadow-sm transition-all"
               >
                 <FileText className="w-8 h-8 text-blue-600" />
                 <div className="text-center">
                    <span className="font-medium block">Extract Text Native</span>
                    <span className="text-xs text-gray-500">Fast, for normal PDFs</span>
                 </div>
               </button>

               <button
                onClick={() => handleAction('ocr')}
                disabled={!file || isProcessing}
                className="flex flex-col items-center gap-3 p-4 border rounded-xl bg-white hover:border-blue-500 hover:shadow-sm transition-all"
               >
                 <FileText className="w-8 h-8 text-purple-600" />
                 <div className="text-center">
                    <span className="font-medium block">OCR Only</span>
                    <span className="text-xs text-gray-500">For scanned images</span>
                 </div>
               </button>

               <button
                onClick={() => handleAction('both')}
                disabled={!file || isProcessing}
                className="flex flex-col items-center gap-3 p-4 border rounded-xl bg-white hover:border-blue-500 hover:shadow-sm transition-all"
               >
                 <FileText className="w-8 h-8 text-green-600" />
                 <div className="text-center">
                    <span className="font-medium block">Extract + OCR</span>
                    <span className="text-xs text-gray-500">Comprehensive (Slow)</span>
                 </div>
               </button>
            </div>

            {isProcessing && (
                <div className="mt-8 flex justify-center items-center text-blue-600 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-medium">Processing Document...</span>
                </div>
            )}
        </section>

        {success && extractedText && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Extracted Text
                    </h2>
                    <button onClick={copyToClipboard} className="text-sm text-blue-600 hover:underline font-medium">
                        Copy to Clipboard
                    </button>
                </div>
                <textarea
                    readOnly
                    value={extractedText}
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg bg-gray-50 outline-none resize-y font-mono text-sm"
                />
            </section>
        )}

        <section className="pt-4 border-t">
          <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
            <Info className="w-5 h-5 flex-shrink-0 text-blue-500" />
            <p>100% Secure. All processing happens directly in your browser. No files are uploaded to any server.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
