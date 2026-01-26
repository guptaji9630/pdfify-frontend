import { Link } from 'react-router-dom';

export default function HomePage() {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="border-b bg-white/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        PDFify
                    </h1>
                    <div className="space-x-4">
                        <Link to="/login" className="text-slate-600 hover:text-slate-900">
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-16">
                <div className="text-center max-w-4xl mx-auto">
                    <h2 className="text-5xl font-bold mb-6">
                        PDF Tools Made{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Simple & Powerful
                        </span>
                    </h2>
                    <p className="text-xl text-slate-600 mb-8">
                        Merge, compress, split, and enhance your PDFs with AI-powered features.
                        Fast, secure, and easy to use.
                    </p>
                    <Link
                        to="/register"
                        className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-opacity"
                    >
                        Start Free →
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mt-20">
                    <div className="bg-white p-8 rounded-xl shadow-lg">
                        <div className="text-4xl mb-4">📄</div>
                        <h3 className="text-xl font-bold mb-2">Merge PDFs</h3>
                        <p className="text-slate-600">
                            Combine multiple PDFs into one document effortlessly.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-lg">
                        <div className="text-4xl mb-4">⚡</div>
                        <h3 className="text-xl font-bold mb-2">Smart Compress</h3>
                        <p className="text-slate-600">
                            AI-powered compression that preserves quality.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-lg">
                        <div className="text-4xl mb-4">🤖</div>
                        <h3 className="text-xl font-bold mb-2">AI Features</h3>
                        <p className="text-slate-600">
                            Classify, summarize, and extract data automatically.
                        </p>
                    </div>
                </div>
            </main>

            <footer className="border-t py-8 text-center text-slate-600">
                <p>&copy; 2026 PDFify. All rights reserved.</p>
            </footer>
        </div>
    );
}
