import { useState } from 'react';
import { documentAPI } from '../lib/api';
import { QAPairsResponse, ApiResponse } from '../types';
import { BookOpen, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface QAPairsModalProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function QAPairsModal({ documentId, isOpen, onClose }: QAPairsModalProps) {
    const [loading, setLoading] = useState(false);
    const [qaPairs, setQAPairs] = useState<QAPairsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(5);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await documentAPI.generateQAPairs(documentId, count);
            const data: ApiResponse<QAPairsResponse> = response.data;
            if (data.success && data.data) {
                setQAPairs(data.data);
                setExpandedIndex(0);
            } else {
                setError(data.error || 'Failed to generate Q&A pairs');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to generate Q&A pairs');
        } finally {
            setLoading(false);
        }
    };

    const toggleQuestion = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-2xl font-bold">Study Mode - Q&A Pairs</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!qaPairs && (
                        <div className="text-center">
                            <BookOpen className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Generate Study Questions</h3>
                            <p className="text-gray-600 mb-6">
                                AI will analyze your document and create question-answer pairs for studying.
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Questions
                                </label>
                                <select
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value={3}>3 questions</option>
                                    <option value={5}>5 questions</option>
                                    <option value={10}>10 questions</option>
                                    <option value={15}>15 questions</option>
                                    <option value={20}>20 questions</option>
                                </select>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate Q&A Pairs'
                                )}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {qaPairs && (
                        <div>
                            <div className="mb-6 text-center">
                                <p className="text-gray-600">
                                    {qaPairs.count} question{qaPairs.count !== 1 ? 's' : ''} generated. Click to reveal answers.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {qaPairs.qaPairs.map((pair, index) => (
                                    <div
                                        key={index}
                                        className="border border-gray-200 rounded-lg overflow-hidden"
                                    >
                                        <button
                                            onClick={() => toggleQuestion(index)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            <div className="flex-1">
                                                <span className="font-medium text-indigo-600 mr-2">
                                                    Q{index + 1}:
                                                </span>
                                                <span className="text-gray-800">{pair.question}</span>
                                            </div>
                                            {expandedIndex === index ? (
                                                <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                            )}
                                        </button>

                                        {expandedIndex === index && (
                                            <div className="p-4 bg-white border-t border-gray-200">
                                                <span className="font-medium text-green-600 mr-2">A:</span>
                                                <span className="text-gray-800">{pair.answer}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t">
                    {qaPairs && (
                        <button
                            onClick={() => {
                                setQAPairs(null);
                                setError(null);
                                setExpandedIndex(null);
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Generate New
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
