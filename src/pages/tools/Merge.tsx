import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Download, ArrowRight } from 'lucide-react';
import { pdfAPI } from '@/lib/api';
import { downloadBlob } from '@/lib/utils';
import FileUploader from '@/components/FileUploader';

export default function MergePage() {
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleMerge = async () => {
        if (files.length < 2) {
            setError('Please select at least 2 PDF files to merge');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const mergedBlob = await pdfAPI.merge(files);

            // Download the merged PDF
            downloadBlob(mergedBlob, `merged-${Date.now()}.pdf`);

            // Reset form
            setFiles([]);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to merge PDFs');
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
                        <h2 className="text-3xl font-bold mb-2">Merge PDFs</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Combine multiple PDF files into a single document
                        </p>
                    </div>

                    {/* File Uploader */}
                    <FileUploader
                        multiple={true}
                        maxFiles={10}
                        onFilesChange={setFiles}
                    />

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={handleMerge}
                            disabled={files.length < 2 || loading}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Merging...
                                </>
                            ) : (
                                <>
                                    <Download className="h-5 w-5" />
                                    Merge PDFs
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" />
                            How it works
                        </h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>1. Upload 2 or more PDF files</li>
                            <li>2. Click "Merge PDFs"</li>
                            <li>3. Download your combined PDF</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
