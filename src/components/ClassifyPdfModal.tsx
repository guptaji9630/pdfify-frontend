import { useState } from 'react';
import { aiAPI } from '../lib/api';
import DocumentTypeBadge from './DocumentTypeBadge';

interface ClassifyPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ClassificationResult {
    type: string;
    confidence: number;
    suggestions?: string[];
}

export default function ClassifyPdfModal({ isOpen, onClose }: ClassifyPdfModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<ClassificationResult | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError('');
            setResult(null);
        }
    };

    const handleClassify = async () => {
        if (!file) {
            setError('Please select a PDF file');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await aiAPI.classify(file);
            setResult(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to classify document');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError('');
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">AI Document Classification</h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {!result ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Select PDF file
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    AI will analyze your document and detect its type
                                </p>
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
                                    onClick={handleClassify}
                                    disabled={loading || !file}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Analyzing...' : '🤖 Classify Document'}
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 space-y-4">
                                <div>
                                    <p className="text-sm text-slate-600 mb-2">Document Type</p>
                                    <DocumentTypeBadge
                                        type={result.type}
                                        confidence={result.confidence}
                                    />
                                </div>

                                <div>
                                    <p className="text-sm text-slate-600 mb-1">File</p>
                                    <p className="text-sm font-medium text-slate-900">{file?.name}</p>
                                </div>

                                {result.suggestions && result.suggestions.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 mb-2">
                                            Suggested Actions
                                        </p>
                                        <ul className="space-y-2">
                                            {result.suggestions.map((suggestion, index) => (
                                                <li
                                                    key={index}
                                                    className="text-sm text-slate-600 flex items-center gap-2"
                                                >
                                                    <span className="text-purple-500">→</span>
                                                    <span className="capitalize">
                                                        {suggestion.replace(/_/g, ' ')}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700"
                                >
                                    Classify Another
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-800"
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
