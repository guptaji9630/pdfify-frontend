import { useState } from 'react';
import { pdfAPI } from '../lib/api';

interface SplitPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SplitPdfModal({ isOpen, onClose }: SplitPdfModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleSplit = async () => {
        if (!file) {
            setError('Please select a PDF file');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const blob = await pdfAPI.split(file, { pages });
            
            // Download the split PDF
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `split_${file.name}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Reset and close
            setFile(null);
            setPages('');
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to split PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Split PDF</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Select PDF file
                        </label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Pages to Extract (optional)
                        </label>
                        <input
                            type="text"
                            value={pages}
                            onChange={(e) => setPages(e.target.value)}
                            placeholder="e.g., 1-3, 5, 7-9"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Leave empty to split into individual pages, or specify ranges like "1-3, 5, 7-9"
                        </p>
                    </div>

                    {file && (
                        <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-slate-700 mb-1">
                                Selected file:
                            </p>
                            <p className="text-sm text-slate-600">{file.name}</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSplit}
                            disabled={loading || !file}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Splitting...' : 'Split PDF'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:text-slate-800"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
