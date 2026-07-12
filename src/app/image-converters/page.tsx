'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, Download, Loader2, Info, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function ImageConvertersPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(file =>
        file.type === 'image/jpeg' || file.type === 'image/png'
      );
      if (selectedFiles.length > 0) {
        setFiles(prev => [...prev, ...selectedFiles]);
        setError(null);
      } else {
        setError('Please select valid JPG or PNG files.');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
        file.type === 'image/jpeg' || file.type === 'image/png'
      );
      if (droppedFiles.length > 0) {
        setFiles(prev => [...prev, ...droppedFiles]);
        setError(null);
      } else {
        setError('Please drop valid JPG or PNG files.');
      }
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index - 1];
    newFiles[index - 1] = temp;
    setFiles(newFiles);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const newFiles = [...files];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + 1];
    newFiles[index + 1] = temp;
    setFiles(newFiles);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      setError('Please select at least 1 image file.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const targetPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        let image;
        if (file.type === 'image/png') {
          image = await targetPdf.embedPng(arrayBuffer);
        } else {
          image = await targetPdf.embedJpg(arrayBuffer);
        }

        const page = targetPdf.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await targetPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `converted_images.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('An error occurred while converting the images.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-3xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b pb-6 text-center sm:text-left">
        <h1 className="text-4xl font-bold text-gray-900">Image Converters</h1>
        <p className="text-lg text-gray-600">
          Convert JPG or PNG images into a PDF document.
        </p>
      </header>

      <div className="flex-1 flex flex-col gap-8">
        {/* Upload Section */}
        <section>
          <div
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
              ${files.length > 0 ? 'border-gray-300 hover:border-gray-400 bg-gray-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="hidden"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-gray-100 text-gray-500 rounded-full">
                <UploadCloud className="w-8 h-8" />
              </div>
              <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500">JPG and PNG files are supported</p>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </section>

        {/* File List Section */}
        {files.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Images to Convert</h2>
            <div className="flex flex-col gap-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="truncate font-medium text-gray-700">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === files.length - 1}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
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
            onClick={handleConvert}
            disabled={files.length === 0 || isProcessing}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-medium transition-colors
              ${files.length === 0
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
                Download PDF
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
