import { useState } from 'react';
import { pdfAPI } from '../lib/api';

interface SplitPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SplitPdfModal({ isOpen, onClose }: SplitPdfModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [splitPoints, setSplitPoints] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultFiles, setResultFiles] = useState<{ name: string; pages: number; url: string }[]>([]);

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
        setResultFiles([]);

        try {
            const res = await pdfAPI.split(file, splitPoints);
            const files = res.data?.data?.files ?? [];
            if (files.length > 0) {
                setResultFiles(files);
            } else {
                setError('Split completed but no file URLs were returned.');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to split PDF');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFile(null); setSplitPoints(''); setResultFiles([]); setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Split PDF</h2>
                    <button
                        onClick={handleClose}
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
                            Split Points (page numbers)
                        </label>
                        <input
                            type="text"
                            value={splitPoints}
                            onChange={(e) => setSplitPoints(e.target.value)}
                            placeholder="e.g., 3,6"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            comma-separated page numbers where splits happen, e.g. <code>3,6</code> splits into pages 1–3, 4–6, 7–end
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

                    {resultFiles.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-green-800 mb-2">Split complete! Download your files:</p>
                            <ul className="space-y-2">
                                {resultFiles.map((f, i) => (
                                    <li key={i} className="flex items-center justify-between">
                                        <span className="text-sm text-slate-700">{f.name} ({f.pages} page{f.pages !== 1 ? 's' : ''})</span>
                                        <a
                                            href={f.url}
                                            download={f.name}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 font-medium hover:underline"
                                        >
                                            Download
                                        </a>
                                    </li>
                                ))}
                            </ul>
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
                            onClick={handleClose}
                            className="px-4 py-2 text-slate-600 hover:text-slate-800"
                        >
                            {resultFiles.length > 0 ? 'Done' : 'Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
