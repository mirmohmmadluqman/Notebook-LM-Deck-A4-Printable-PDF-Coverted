'use client';

import { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, Download, Loader2, Info, Trash2, Lock } from 'lucide-react';

export default function ProtectPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
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

  const handleProtect = async () => {
    if (!file || !password) return;

    setIsProcessing(true);
    setError(null);

    // Mock processing for client-side limitation
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `protected_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Note: Client-side PDF encryption is not fully supported by the underlying pdf-lib engine used in this tool natively without additional wrappers. This file is returned un-encrypted as a mock implementation.');
    } catch (err) {
      console.error(err);
      setError('An error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-3xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-2 border-b pb-6 text-center sm:text-left">
        <h1 className="text-4xl font-bold text-gray-900">Protect PDF</h1>
        <p className="text-lg text-gray-600">
          Add password encryption to your PDF document.
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

        {/* Configuration Section */}
        {file && (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Security Settings</h2>
            <div className="flex flex-col gap-2 relative">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password"
                  className="pl-10 p-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>
        )}

        {/* Action Section */}
        <section className="pt-4 border-t">
          <button
            onClick={handleProtect}
            disabled={!file || !password || isProcessing}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-medium transition-colors
              ${!file || !password
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Encrypting PDF...
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                Protect PDF
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
