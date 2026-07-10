import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-3xl mx-auto flex flex-col items-center justify-center text-center gap-8">
      <div className="p-6 bg-blue-50 text-blue-600 rounded-full mb-4">
        <Clock className="w-16 h-16" />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-xl text-gray-600 max-w-xl mx-auto">
          {description}
        </p>
      </div>

      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Development Status</h2>
        <p className="text-gray-600 mb-4">
          Our team is currently working hard to bring you this feature. It will be 100% client-side, secure, and fast.
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
        </div>
        <p className="text-sm text-gray-500 text-right">In Progress...</p>
      </div>

      <Link
        href="/"
        className="mt-4 flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Tools Menu
      </Link>
    </main>
  );
}
