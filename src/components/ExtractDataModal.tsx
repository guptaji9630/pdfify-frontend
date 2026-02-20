import { useState, useEffect } from 'react';
import { aiAPI, documentAPI } from '../lib/api';

interface ExtractDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    preSelectedFile?: File | null;
    documentId?: string;  // NEW: Support for stored documents
    extractType?: 'auto' | 'invoice' | 'receipt' | 'form' | 'contract';
}

interface ExtractedData {
    documentType?: string;
    confidence?: number;
    fields?: Record<string, any>;
    tables?: any[];
    rawText?: string;
}

export default function ExtractDataModal({ 
    isOpen, 
    onClose, 
    preSelectedFile,
    documentId,  // NEW
    extractType = 'auto'
}: ExtractDataModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [selectedType, setSelectedType] = useState(extractType);

    useEffect(() => {
        if (isOpen && preSelectedFile) {
            setFile(preSelectedFile);
            handleExtractFile(preSelectedFile);
        } else if (isOpen && documentId) {
            // Auto-extract if documentId is provided
            handleExtractDocument();
        }
    }, [isOpen, preSelectedFile, documentId]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError('');
            setExtractedData(null);
        }
    };

    const handleExtractFile = async (fileToExtract: File) => {
        setLoading(true);
        setError('');

        try {
            const response = await aiAPI.extractData(fileToExtract);
            console.log('Extract Data API Response:', response);

            let data;
            if (response.success && response.data) {
                data = response.data;
            } else {
                data = response;
            }

            setExtractedData(data);
        } catch (err: any) {
            console.error('Extraction error:', err);
            console.error('Error response:', err.response?.data);
            
            let errorMessage = 'Failed to extract data from document';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
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

    // NEW: Handle extraction from stored document
    const handleExtractDocument = async () => {
        if (!documentId) return;
        
        setLoading(true);
        setError('');

        try {
            const response = await documentAPI.extractDocumentData(documentId, selectedType);
            console.log('Extract Data API Response:', response);

            let data;
            if (response.data.success && response.data.data) {
                data = response.data.data;
            } else {
                data = response.data;
            }

            setExtractedData(data);
        } catch (err: any) {
            console.error('Extraction error:', err);
            
            let errorMessage = 'Failed to extract data from document';
            if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleExtract = async () => {
        if (documentId) {
            await handleExtractDocument();
        } else if (file) {
            await handleExtractFile(file);
        } else {
            setError('Please select a PDF file');
        }
    };

    const handleReset = () => {
        setFile(null);
        setExtractedData(null);
        setError('');
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleCopyJSON = () => {
        if (extractedData) {
            navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">🔍 AI Data Extraction</h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {!extractedData ? (
                        <>
                            {!preSelectedFile && !documentId && (
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
                                        AI will extract structured data from invoices, receipts, forms, and more
                                    </p>
                                </div>
                            )}

                            {/* Document Type Selector */}
                            {documentId && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Document Type
                                    </label>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value as any)}
                                        className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="auto">Auto-detect</option>
                                        <option value="invoice">Invoice</option>
                                        <option value="receipt">Receipt</option>
                                        <option value="form">Form</option>
                                        <option value="contract">Contract</option>
                                    </select>
                                </div>
                            )}

                            {preSelectedFile && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-purple-700 mb-1">
                                        📄 Auto-selected from classification:
                                    </p>
                                    <p className="text-sm text-purple-600">{file?.name}</p>
                                </div>
                            )}

                            {file && !preSelectedFile && (
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-sm font-medium text-slate-700 mb-1">Selected file:</p>
                                    <p className="text-sm text-slate-600">{file.name}</p>
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
                                        onClick={handleExtract}
                                        disabled={loading || !file}
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Extracting...' : '🔍 Extract Data'}
                                    </button>
                                )}
                                {preSelectedFile && loading && (
                                    <div className="flex-1 flex items-center justify-center gap-2 text-purple-600">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span className="font-medium">Extracting data...</span>
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
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-5 space-y-4">
                                {/* Document Type & Confidence */}
                                {extractedData.documentType && (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-600 mb-1">Document Type</p>
                                            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-semibold capitalize">
                                                {extractedData.documentType}
                                            </span>
                                        </div>
                                        {extractedData.confidence && (
                                            <span className="text-xs text-slate-500">
                                                {(extractedData.confidence * 100).toFixed(0)}% confidence
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Extracted Fields */}
                                {extractedData.fields && Object.keys(extractedData.fields).length > 0 && (
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">
                                                📋 Extracted Fields
                                            </h4>
                                            <button
                                                onClick={handleCopyJSON}
                                                className="text-xs text-purple-600 hover:text-purple-700"
                                            >
                                                📋 Copy JSON
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(extractedData.fields).map(([key, value]) => (
                                                <div key={key} className="bg-slate-50 rounded p-2">
                                                    <p className="text-xs text-slate-500 capitalize mb-1">
                                                        {key.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Extracted Tables */}
                                {extractedData.tables && extractedData.tables.length > 0 && (
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                        <h4 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide">
                                            📊 Extracted Tables
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <pre className="text-xs text-slate-700 bg-slate-50 p-3 rounded">
                                                {JSON.stringify(extractedData.tables, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700"
                                >
                                    Extract Another
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
