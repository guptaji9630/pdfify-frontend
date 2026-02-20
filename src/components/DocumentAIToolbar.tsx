import { useState } from 'react';
import { documentAPI } from '../lib/api';
import { ApiResponse } from '../types';
import { Sparkles, X, Copy } from 'lucide-react';

interface DocumentAIToolbarProps {
    documentId: string;
    onActionItemsClick: () => void;
    onQAPairsClick: () => void;
    onSummarizeClick: () => void;
    onClassifyClick: () => void;
    onExtractDataClick: () => void;
    onTranslateClick: () => void;
}

export default function DocumentAIToolbar({
    documentId,
    onActionItemsClick,
    onQAPairsClick,
    onSummarizeClick,
    onClassifyClick,
    onExtractDataClick,
    onTranslateClick,
}: DocumentAIToolbarProps) {
    const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
    const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleExecutiveSummary = async () => {
        if (executiveSummary) {
            setShowExecutiveSummary(true);
            return;
        }

        try {
            setLoading(true);
            const response = await documentAPI.executiveSummary(documentId);
            const data: ApiResponse<{ summary: string }> = response.data;
            if (data.success && data.data) {
                setExecutiveSummary(data.data.summary);
                setShowExecutiveSummary(true);
            }
        } catch (err: any) {
            alert('Failed to generate executive summary');
        } finally {
            setLoading(false);
        }
    };

    const copyExecutiveSummary = () => {
        if (executiveSummary) {
            navigator.clipboard.writeText(executiveSummary);
            alert('Executive summary copied to clipboard!');
        }
    };

    return (
        <>
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-800">AI Tools</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <button
                        onClick={handleExecutiveSummary}
                        disabled={loading}
                        className="px-3 py-2 bg-white text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors border border-gray-200 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Quick Summary'}
                    </button>
                    <button
                        onClick={onSummarizeClick}
                        className="px-3 py-2 bg-white text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors border border-gray-200"
                    >
                        Full Summary
                    </button>
                    <button
                        onClick={onClassifyClick}
                        className="px-3 py-2 bg-white text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors border border-gray-200"
                    >
                        Identify Type
                    </button>
                    <button
                        onClick={onActionItemsClick}
                        className="px-3 py-2 bg-white text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors border border-gray-200"
                    >
                        Extract Tasks
                    </button>
                    <button
                        onClick={onQAPairsClick}
                        className="px-3 py-2 bg-white text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors border border-gray-200"
                    >
                        Study Mode
                    </button>
                    <button
                        onClick={onExtractDataClick}
                        className="px-3 py-2 bg-white text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors border border-gray-200"
                    >
                        Extract Data
                    </button>
                    <button
                        onClick={onTranslateClick}
                        className="px-3 py-2 bg-white text-sm text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors border border-gray-200"
                    >
                        Translate
                    </button>
                </div>
            </div>

            {/* Executive Summary Modal */}
            {showExecutiveSummary && executiveSummary && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl">
                        <div className="flex items-center justify-between p-6 border-b">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-purple-600" />
                                <h2 className="text-xl font-bold">Executive Summary</h2>
                            </div>
                            <button
                                onClick={() => setShowExecutiveSummary(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                                <p className="text-gray-800 leading-relaxed">{executiveSummary}</p>
                            </div>

                            <button
                                onClick={copyExecutiveSummary}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Copy to Clipboard
                            </button>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t">
                            <button
                                onClick={() => setShowExecutiveSummary(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
