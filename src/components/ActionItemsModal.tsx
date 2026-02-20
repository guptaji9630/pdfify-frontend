import { useState } from 'react';
import { documentAPI } from '../lib/api';
import { ActionItemsResponse, ApiResponse } from '../types';
import { CheckSquare, X, Loader2, Copy, Download } from 'lucide-react';

interface ActionItemsModalProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ActionItemsModal({ documentId, isOpen, onClose }: ActionItemsModalProps) {
    const [loading, setLoading] = useState(false);
    const [actionItems, setActionItems] = useState<ActionItemsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleExtract = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await documentAPI.extractActionItems(documentId);
            const data: ApiResponse<ActionItemsResponse> = response.data;
            if (data.success && data.data) {
                setActionItems(data.data);
            } else {
                setError(data.error || 'Failed to extract action items');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to extract action items');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (actionItems) {
            const text = actionItems.actionItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
            navigator.clipboard.writeText(text);
            alert('Action items copied to clipboard!');
        }
    };

    const downloadAsText = () => {
        if (actionItems) {
            const text = actionItems.actionItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'action-items.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <CheckSquare className="w-6 h-6 text-purple-600" />
                        <h2 className="text-2xl font-bold">Extract Action Items</h2>
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
                    {!actionItems && (
                        <div className="text-center">
                            <CheckSquare className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Extract Tasks & To-Dos</h3>
                            <p className="text-gray-600 mb-6">
                                AI will analyze your document and extract action items, tasks, and to-dos.
                            </p>
                            <button
                                onClick={handleExtract}
                                disabled={loading}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    'Extract Action Items'
                                )}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {actionItems && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">
                                    Found {actionItems.count} action item{actionItems.count !== 1 ? 's' : ''}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={copyToClipboard}
                                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </button>
                                    <button
                                        onClick={downloadAsText}
                                        className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {actionItems.actionItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            className="mt-1 w-5 h-5 text-purple-600 rounded"
                                        />
                                        <p className="flex-1 text-gray-800">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t">
                    {actionItems && (
                        <button
                            onClick={() => {
                                setActionItems(null);
                                setError(null);
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Extract Again
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
