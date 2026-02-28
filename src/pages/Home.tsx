import { Link } from 'react-router-dom';

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* backdrop-blur is GPU-expensive on low-end mobile — only enable on sm+ */}
            <header className="border-b bg-white/80 sm:bg-white/50 sm:backdrop-blur-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        PDFify
                    </h1>
                    <nav className="flex items-center gap-2 sm:gap-4">
                        <Link
                            to="/login"
                            className="text-sm sm:text-base text-slate-600 hover:text-slate-900 transition-colors no-tap-highlight"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="bg-blue-600 text-white text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors no-tap-highlight whitespace-nowrap"
                        >
                            Get Started Free
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-10 sm:py-16">
                {/* Hero */}
                <div className="text-center max-w-4xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 sm:mb-6 leading-tight">
                        Sign, Edit &amp; Translate{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            PDF Online — Free
                        </span>
                    </h2>
                    <p className="text-base sm:text-xl text-slate-600 mb-4">
                        The all-in-one online PDF editor without watermark. Sign PDF, edit PDF, compress, merge,
                        split, and translate PDF files in seconds — on any device, including mobile.
                    </p>
                    <p className="text-sm sm:text-base text-slate-500 mb-8">
                        No software to install. No watermarks. Works on desktop &amp; mobile.
                    </p>
                    <Link
                        to="/register"
                        className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:opacity-90 transition-opacity no-tap-highlight"
                    >
                        Start Free →
                    </Link>
                </div>

                {/* Features Grid — each card targets one high-intent keyword */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-8 mt-12 sm:mt-20">
                    <div className="bg-white p-5 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-3 sm:mb-4">✍️</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2">Sign PDF Online Free</h3>
                        <p className="text-sm sm:text-base text-slate-600">
                            Add your signature to any PDF instantly — no downloads, no watermark,
                            completely free.
                        </p>
                    </div>
                    <div className="bg-white p-5 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-3 sm:mb-4">✏️</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2">Edit PDF Online</h3>
                        <p className="text-sm sm:text-base text-slate-600">
                            Annotate, highlight, and modify your PDF right in the browser — no
                            software needed.
                        </p>
                    </div>
                    <div className="bg-white p-5 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-3 sm:mb-4">🌐</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2">Translate PDF Online</h3>
                        <p className="text-sm sm:text-base text-slate-600">
                            AI-powered PDF translation into dozens of languages while preserving
                            original formatting.
                        </p>
                    </div>
                    <div className="bg-white p-5 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-3 sm:mb-4">📱</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2">Edit PDF on Mobile</h3>
                        <p className="text-sm sm:text-base text-slate-600">
                            PDFify is fully responsive — edit, sign, and share PDFs from your phone
                            or tablet.
                        </p>
                    </div>
                    <div className="bg-white p-5 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-3 sm:mb-4">🚫</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2">PDF Editor Without Watermark</h3>
                        <p className="text-sm sm:text-base text-slate-600">
                            Every tool — compression, merging, signing — produces clean output with
                            zero watermarks.
                        </p>
                    </div>
                    <div className="bg-white p-5 sm:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                        <div className="text-4xl mb-3 sm:mb-4">⚡</div>
                        <h3 className="text-lg sm:text-xl font-bold mb-2">Compress, Merge &amp; Split</h3>
                        <p className="text-sm sm:text-base text-slate-600">
                            AI-powered compression, merge multiple PDFs into one, or split a PDF
                            into separate files.
                        </p>
                    </div>
                </div>

                {/* AI Features highlight */}
                <div className="mt-12 sm:mt-20 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 sm:p-10 text-center">
                    <div className="text-4xl mb-3 sm:mb-4">🤖</div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">AI-Powered PDF Tools</h2>
                    <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-5 sm:mb-6">
                        Go beyond basic editing. PDFify uses AI to summarize documents, extract key
                        data, classify PDFs, generate Q&amp;A pairs, and translate — all without leaving
                        your browser.
                    </p>
                    <Link
                        to="/register"
                        className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity no-tap-highlight"
                    >
                        Try AI Features Free
                    </Link>
                </div>
            </main>

            <footer className="border-t py-6 sm:py-8 text-center text-slate-600">
                <p className="mb-2 text-xs sm:text-sm">
                    Sign PDF · Edit PDF · Compress PDF · Merge PDF · Split PDF · Translate PDF · Add
                    Signature to PDF
                </p>
                <p className="text-sm">&copy; 2026 PDFify. All rights reserved.</p>
            </footer>
        </div>
    );
}
