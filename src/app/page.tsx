import Link from 'next/link';
import {
  LayoutTemplate,
  FileStack,
  Scissors,
  FileUp,
  Crop,
  FileText,
  Image as ImageIcon,
  Minimize,
  Lock,
  Unlock,
  PenTool,
  Signature,
  Stamp
} from 'lucide-react';

const toolCategories = [
  {
    title: "File Manipulation & Organization",
    tools: [
      { name: "Merge PDF", description: "Combine multiple files into a single document.", icon: FileStack, active: false, href: "/merge-pdf" },
      { name: "Split PDF", description: "Extract specific pages or split a large document.", icon: Scissors, active: false, href: "/split-pdf" },
      { name: "Organize Pages", description: "Reorder, delete, or add new pages.", icon: FileUp, active: false, href: "/organize-pages" },
      { name: "Rotate & Crop", description: "Adjust page orientation and trim margins.", icon: Crop, active: false, href: "/rotate-crop" },
    ]
  },
  {
    title: "Conversion Utilities",
    tools: [
      { name: "PDF to Office", description: "Convert PDFs to editable formats like Word, Excel, or PowerPoint.", icon: FileText, active: false, href: "/pdf-to-office" },
      { name: "Office to PDF", description: "Convert Word, Excel, and PowerPoint back into PDFs.", icon: FileText, active: false, href: "/office-to-pdf" },
      { name: "Image Converters", description: "Extract images from PDFs or convert image formats.", icon: ImageIcon, active: false, href: "/image-converters" },
    ]
  },
  {
    title: "Optimization & Security",
    tools: [
      { name: "Compress PDF", description: "Reduce file sizes for easier sharing.", icon: Minimize, active: false, href: "/compress-pdf" },
      { name: "Protect PDF", description: "Add password encryption and restrict editing.", icon: Lock, active: false, href: "/protect-pdf" },
      { name: "Unlock PDF", description: "Remove security protections with the password.", icon: Unlock, active: false, href: "/unlock-pdf" },
    ]
  },
  {
    title: "Annotation & Editing",
    tools: [
      { name: "PDF Editor", description: "Add text boxes, highlights, sticky notes, and drawings.", icon: PenTool, active: false, href: "/pdf-editor" },
      { name: "Sign PDF", description: "Draw, type, or upload your e-signature.", icon: Signature, active: false, href: "/sign-pdf" },
      { name: "Watermark", description: "Add customizable text or image watermarks.", icon: Stamp, active: false, href: "/watermark" },
    ]
  }
];

export default function IndexPage() {
  return (
    <main className="min-h-screen p-6 sm:p-12 max-w-5xl mx-auto flex flex-col gap-8">
      <header className="flex flex-col gap-4 border-b pb-8 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">PDF Tools Menu</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Every tool you need to work with PDFs in one place. All 100% secure and processed directly in your browser.
        </p>
      </header>

      <div className="flex-1 flex flex-col gap-12">
        {/* Active Tool(s) Section */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/notebook-layout-editor"
              className="group relative flex flex-col gap-4 p-6 rounded-2xl border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 hover:border-blue-600 transition-all shadow-sm hover:shadow-md"
            >
              <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                Available
              </div>
              <div className="p-3 bg-blue-600 text-white rounded-xl w-fit group-hover:scale-110 transition-transform">
                <LayoutTemplate className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Notebook LM Slide Deck Layout Editor</h3>
                <p className="text-gray-600">Convert your exported NotebookLM PDFs into printable 4-up or 2-up layouts effortlessly.</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Categories Section */}
        {toolCategories.map((category, idx) => (
          <section key={idx} className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-gray-800">{category.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.tools.map((tool, toolIdx) => (
                <Link
                  href={tool.href}
                  key={toolIdx}
                  className="relative flex flex-col gap-4 p-6 rounded-2xl border border-gray-200 bg-white opacity-80 hover:opacity-100 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="absolute top-4 right-4 bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                    Coming Soon
                  </div>
                  <div className="p-3 bg-gray-100 text-gray-500 rounded-xl w-fit">
                    <tool.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{tool.name}</h3>
                    <p className="text-sm text-gray-500">{tool.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
