import { useState, useEffect } from 'react';
import { aiAPI, documentAPI } from '../lib/api';
import SummaryDisplay from './SummaryDisplay';

interface SummarizePdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    preSelectedFile?: File | null;
    documentId?: string;  // NEW: Support for stored documents
}

export default function SummarizePdfModal({ isOpen, onClose, preSelectedFile, documentId }: SummarizePdfModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState<any>(null);
    
    // Handle pre-selected file from classification or documentId
    useEffect(() => {
        if (isOpen && preSelectedFile) {
            setFile(preSelectedFile);
            handleSummarizeFile(preSelectedFile);
        } else if (isOpen && documentId) {
            handleSummarizeDocument();
        }
    }, [isOpen, preSelectedFile, documentId]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError('');
            setSummary(null);
        }
    };

    // NEW: Summarize stored document
    const handleSummarizeDocument = async () => {
        if (!documentId) return;

        setLoading(true);
        setError('');

        try {
            const response = await documentAPI.summarizeDocument(documentId, 'medium');
            console.log('Summarize Document API Response:', response);
            
            let summaryData;
            if (response.data.success && response.data.data) {
                summaryData = response.data.data;
            } else {
                summaryData = response.data;
            }
            
            setSummary(summaryData);
        } catch (err: any) {
            console.error('Summarization error:', err);
            setError(err.response?.data?.error || 'Failed to summarize document');
        } finally {
            setLoading(false);
        }
    };

    const handleSummarizeFile = async (fileToSummarize: File) => {
        setLoading(true);
        setError('');

        try {
            const response = await aiAPI.summarize(fileToSummarize);
            console.log('Summarize API Response:', response);
            
            // Handle structured response from backend
            let summaryData;
            
            if (response.success && response.data) {
                // Backend returns: { success: true, data: { summary, keyPoints, entities, metadata } }
                summaryData = response.data;
            } else if (response.summary || response.keyPoints) {
                // Direct data object
                summaryData = response;
            } else if (typeof response === 'string') {
                // Plain text response
                summaryData = response;
            } else {
                // Fallback
                summaryData = response.text || response.summary || JSON.stringify(response);
            }
            
            console.log('Parsed Summary Data:', summaryData);
            setSummary(summaryData);
        } catch (err: any) {
            console.error('Summarization error:', err);
            setError(err.response?.data?.error || 'Failed to summarize document');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSummarize = async () => {
        if (documentId) {
            await handleSummarizeDocument();
        } else if (file) {
            await handleSummarizeFile(file);
        } else {
            setError('Please select a PDF file');
        }
    };

    const handleReset = () => {
        setFile(null);
        setSummary(null);
        setError('');
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">AI Document Summarization</h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {!summary ? (
                        <>
                            {!preSelectedFile && (
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
                                    <p className="text-xs text-slate-500 mt-2">
                                        AI will read your document and create a concise summary
                                    </p>
                                </div>
                            )}
                            
                            {preSelectedFile && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-blue-700 mb-1">
                                        📄 Auto-selected from classification:
                                    </p>
                                    <p className="text-sm text-blue-600">{file?.name}</p>
                                </div>
                            )}

                            {file && !preSelectedFile && (
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
                                {!preSelectedFile && (
                                    <button
                                        onClick={handleSummarize}
                                        disabled={loading || !file}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Summarizing...
                                            </span>
                                        ) : (
                                            '📝 Summarize Document'
                                        )}
                                    </button>
                                )}
                                {preSelectedFile && loading && (
                                    <div className="flex-1 flex items-center justify-center gap-2 text-blue-600">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="font-medium">Analyzing your document...</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:text-slate-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <SummaryDisplay summary={summary} fileName={file?.name} />

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700"
                                >
                                    Summarize Another
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
