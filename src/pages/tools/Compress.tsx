import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Download, Zap } from 'lucide-react';
import { pdfAPI } from '@/lib/api';
import { downloadBlob, formatFileSize } from '@/lib/utils';
import FileUploader from '@/components/FileUploader';

export default function CompressPage() {
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);
    const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<{
        originalSize: number;
        compressedSize: number;
        savings: string;
    } | null>(null);

    const handleCompress = async () => {
        if (files.length === 0) {
            setError('Please select a PDF file');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await pdfAPI.compress(files[0], quality);

            // Verify we have blob data
            if (!response.data || response.data.size === 0) {
                throw new Error('Received empty response from server');
            }

            // Get compression info from headers
            const originalSize = parseInt(response.headers?.['x-original-size'] || files[0].size.toString());
            const compressedSize = parseInt(response.headers?.['x-compressed-size'] || response.data.size.toString());
            const savings = response.headers?.['x-savings-percent'] || '0';

            setResult({
                originalSize,
                compressedSize,
                savings,
            });

            // Download the compressed PDF
            downloadBlob(response.data, `compressed-${Date.now()}.pdf`);

            // Reset form
            setFiles([]);
        } catch (err: any) {
            console.error('Compression error:', err);
            
            // Handle blob error response
            let errorMessage = 'Failed to compress PDF';
            if (err.response?.data instanceof Blob) {
                try {
                    const text = await err.response.data.text();
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = 'Failed to compress PDF';
                }
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
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
                        <h2 className="text-3xl font-bold mb-2">Compress PDF</h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Reduce PDF file size while maintaining quality
                        </p>
                    </div>

                    {/* File Uploader */}
                    <FileUploader
                        multiple={false}
                        onFilesChange={setFiles}
                    />

                    {/* Quality Selector */}
                    {files.length > 0 && (
                        <div className="mt-6">
                            <label className="block text-sm font-medium mb-3">
                                Compression Quality
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setQuality('low')}
                                    className={`p-4 rounded-lg border-2 transition-all ${quality === 'low'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-semibold text-sm">Low Quality</div>
                                    <div className="text-xs text-gray-500 mt-1">~60% smaller</div>
                                </button>

                                <button
                                    onClick={() => setQuality('medium')}
                                    className={`p-4 rounded-lg border-2 transition-all ${quality === 'medium'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-semibold text-sm">Medium</div>
                                    <div className="text-xs text-gray-500 mt-1">~40% smaller</div>
                                </button>

                                <button
                                    onClick={() => setQuality('high')}
                                    className={`p-4 rounded-lg border-2 transition-all ${quality === 'high'
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="font-semibold text-sm">High Quality</div>
                                    <div className="text-xs text-gray-500 mt-1">~20% smaller</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                ✓ Compression Successful!
                            </h4>
                            <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                                <div>Original size: {formatFileSize(result.originalSize)}</div>
                                <div>Compressed size: {formatFileSize(result.compressedSize)}</div>
                                <div className="font-semibold">Saved {result.savings}%</div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-8">
                        <button
                            onClick={handleCompress}
                            disabled={files.length === 0 || loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Compressing...
                                </>
                            ) : (
                                <>
                                    <Download className="h-5 w-5" />
                                    Compress PDF
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Compression Tips
                        </h4>
                        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                            <li>• Low quality: Best for text-heavy documents</li>
                            <li>• Medium: Balanced for mixed content</li>
                            <li>• High quality: Preserves images and graphics</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
