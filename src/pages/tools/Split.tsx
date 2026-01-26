import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Download, Scissors } from 'lucide-react';
import { pdfAPI } from '@/lib/api';
import { downloadBlob } from '@/lib/utils';
import FileUploader from '@/components/FileUploader';

export default function SplitPage() {
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);
    const [pageRange, setPageRange] = useState('');
    const [mode, setMode] = useState<'range' | 'individual'>('range');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSplit = async () => {
        if (files.length === 0) {
            setError('Please select a PDF file');
            return;
        }

        if (!pageRange.trim()) {
            setError('Please specify page range (e.g., "1-3,5,7-9")');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const splitBlob = await pdfAPI.split(files[0], { pages: pageRange });

            // Download the split PDF
            downloadBlob(splitBlob, `split-${Date.now()}.pdf`);

            // Reset form
            setFiles([]);
            setPageRange('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to split PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="border-b bg-white/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1
                        onClick={() => navigate('/dashboard')}
                        className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer"
                    >
                        PDFify
                    </h1>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
                    {/* Title */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-2">Split PDF</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Extract specific pages from your PDF
                        </p>
                    </div>

                    {/* File Uploader */}
                    <FileUploader
                        multiple={false}
                        onFilesChange={setFiles}
                    />

                    {/* Page Range Input */}
                    {files.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Page Range
                                </label>
                                <input
                                    type="text"
                                    value={pageRange}
                                    onChange={(e) => setPageRange(e.target.value)}
                                    placeholder="e.g., 1-3,5,7-9 or 'all'"
                                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Examples: "1-3" (pages 1 to 3), "1,3,5" (specific pages), "all" (all pages)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-3">
                                    Split Mode
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setMode('range')}
                                        className={`p-4 rounded-lg border-2 transition-all ${mode === 'range'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm">Range</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            All pages in one PDF
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setMode('individual')}
                                        className={`p-4 rounded-lg border-2 transition-all ${mode === 'individual'
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm">Individual</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Separate PDF per page
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-8">
                        <button
                            onClick={handleSplit}
                            disabled={files.length === 0 || !pageRange.trim() || loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Splitting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-5 w-5" />
                                    Split PDF
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                            <Scissors className="h-4 w-4" />
                            Page Range Examples
                        </h4>
                        <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                            <li>• "1-5" - Pages 1 through 5</li>
                            <li>• "1,3,5" - Pages 1, 3, and 5 only</li>
                            <li>• "1-3,7-9" - Pages 1-3 and 7-9</li>
                            <li>• "all" - All pages in the document</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
