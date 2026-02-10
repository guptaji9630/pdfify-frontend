import { useState } from 'react';
import { aiAPI } from '../lib/api';
import DocumentTypeBadge from './DocumentTypeBadge';

interface ClassifyPdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    onActionSelect?: (action: string, file: File) => void;
}

interface ClassificationResult {
    type: string;
    confidence: number;
    suggestions?: string[];
}

export default function ClassifyPdfModal({ isOpen, onClose, onActionSelect }: ClassifyPdfModalProps) {
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
            const response = await aiAPI.classify(file);
            
            // Log the actual response for debugging
            console.log('API Response:', response);
            
            // Validate API response structure
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response from server');
            }
            
            // Handle different possible response formats
            let data = response;
            
            // Check if data is nested (common backend pattern)
            if (response.data && typeof response.data === 'object') {
                data = response.data;
            } else if (response.result && typeof response.result === 'object') {
                data = response.result;
            }
            
            // Extract type from various possible property names
            const type = data.type || data.document_type || data.documentType || data.classification;
            
            if (!type) {
                console.error('Response structure:', data);
                throw new Error(`Classification result missing document type. Received: ${JSON.stringify(data)}`);
            }
            
            // Extract confidence and suggestions with fallbacks
            const confidence = data.confidence || data.score || 0;
            const suggestions = Array.isArray(data.suggestions) 
                ? data.suggestions 
                : Array.isArray(data.recommended_actions)
                ? data.recommended_actions
                : [];
            
            // Ensure suggestions is an array (even if empty)
            const validatedData = {
                type: String(type).toLowerCase(),
                confidence: typeof confidence === 'number' ? confidence : parseFloat(confidence) || 0,
                suggestions: suggestions
            };
            
            console.log('Validated data:', validatedData);
            setResult(validatedData);
        } catch (err: any) {
            console.error('Classification error:', err);
            let errorMessage = 'Failed to classify document';
            
            if (err.message) {
                errorMessage = err.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.response?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            } else if (err.response?.status === 400) {
                errorMessage = 'Invalid PDF file. Please check the file and try again.';
            } else if (!navigator.onLine) {
                errorMessage = 'No internet connection. Please check your network.';
            }
            
            setError(errorMessage);
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
                                    {result.type ? (
                                        <DocumentTypeBadge
                                            type={result.type}
                                            confidence={result.confidence}
                                        />
                                    ) : (
                                        <p className="text-sm text-slate-500">Type not detected</p>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm text-slate-600 mb-1">File</p>
                                    <p className="text-sm font-medium text-slate-900">{file?.name || 'Unknown'}</p>
                                </div>

                                {result.suggestions && Array.isArray(result.suggestions) && result.suggestions.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 mb-2">
                                            Suggested Actions
                                        </p>
                                        <ul className="space-y-2">
                                            {result.suggestions.map((suggestion, index) => (
                                                suggestion && (
                                                    <li
                                                        key={index}
                                                        onClick={() => {
                                                            if (file && onActionSelect) {
                                                                const action = String(suggestion).toLowerCase();
                                                                onActionSelect(action, file);
                                                                handleClose();
                                                            }
                                                        }}
                                                        className="text-sm text-slate-600 flex items-center gap-2 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition-colors group"
                                                    >
                                                        <span className="text-purple-500 group-hover:text-purple-700">→</span>
                                                        <span className="capitalize group-hover:text-purple-700 group-hover:font-medium">
                                                            {String(suggestion).replace(/_/g, ' ')}
                                                        </span>
                                                    </li>
                                                )
                                            ))}
                                        </ul>
                                        <p className="text-xs text-slate-500 mt-2 italic">
                                            💡 Click on any action to perform it with this document
                                        </p>
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
