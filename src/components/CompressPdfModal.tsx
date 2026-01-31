import { useState } from 'react';
import { pdfAPI } from '../lib/api';

interface CompressPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CompressPdfModal({ isOpen, onClose }: CompressPdfModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleCompress = async () => {
        if (!file) {
            setError('Please select a PDF file');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const blob = await pdfAPI.compress(file, quality);
            
            // Download the compressed PDF
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `compressed_${file.name}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Reset and close
            setFile(null);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to compress PDF');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Compress PDF</h2>
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
                            Compression Quality
                        </label>
                        <div className="space-y-2">
                            {(['high', 'medium', 'low'] as const).map((q) => (
                                <label key={q} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="quality"
                                        value={q}
                                        checked={quality === q}
                                        onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
                                        className="mr-2"
                                    />
                                    <span className="capitalize">{q}</span>
                                    <span className="text-xs text-slate-500 ml-2">
                                        {q === 'high' && '(Best quality, larger file)'}
                                        {q === 'medium' && '(Balanced)'}
                                        {q === 'low' && '(Smallest file, lower quality)'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {file && (
                        <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-slate-700 mb-1">
                                Selected file:
                            </p>
                            <p className="text-sm text-slate-600">{file.name}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleCompress}
                            disabled={loading || !file}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Compressing...' : 'Compress PDF'}
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
