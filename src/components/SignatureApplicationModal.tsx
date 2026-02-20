import { useState, useEffect } from 'react';
import { documentAPI } from '../lib/api';
import { Signature, ApiResponse } from '../types';
import { PenTool, X, Loader2, Check } from 'lucide-react';

interface SignatureApplicationModalProps {
    documentId: string;
    isOpen: boolean;
    onClose: () => void;
    onSignatureApplied: () => void;
}

export default function SignatureApplicationModal({
    documentId,
    isOpen,
    onClose,
    onSignatureApplied,
}: SignatureApplicationModalProps) {
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    
    // Signature placement options
    const [pageNumber, setPageNumber] = useState(1);
    const [xPosition, setXPosition] = useState(350);
    const [yPosition, setYPosition] = useState(100);
    const [signatureWidth, setSignatureWidth] = useState<number | undefined>(undefined);
    const [signatureHeight, setSignatureHeight] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (isOpen) {
            fetchSignatures();
        }
    }, [isOpen]);

    const fetchSignatures = async () => {
        try {
            setLoading(true);
            const response = await documentAPI.listSignatures();
            const data: ApiResponse<Signature[]> = response.data;
            if (data.success && data.data) {
                setSignatures(data.data);
                // Auto-select default signature
                const defaultSig = data.data.find((sig) => sig.isDefault);
                if (defaultSig) {
                    setSelectedSignature(defaultSig);
                    setSignatureWidth(defaultSig.width);
                    setSignatureHeight(defaultSig.height);
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch signatures:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApplySignature = async () => {
        if (!selectedSignature) {
            alert('Please select a signature');
            return;
        }

        try {
            setApplying(true);
            await documentAPI.applySignature(documentId, {
                signatureId: selectedSignature.id,
                pageNumber,
                x: xPosition,
                y: yPosition,
                width: signatureWidth ?? selectedSignature.width ?? 180,
                height: signatureHeight ?? selectedSignature.height ?? 70,
            });
            alert('Signature applied successfully!');
            onSignatureApplied();
            onClose();
        } catch (err: any) {
            alert('Failed to apply signature: ' + (err.response?.data?.error || err.message));
        } finally {
            setApplying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <div className="flex items-center gap-3">
                        <PenTool className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-bold">Apply Signature</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                            <p className="text-gray-600">Loading signatures...</p>
                        </div>
                    ) : signatures.length === 0 ? (
                        <div className="text-center py-8">
                            <PenTool className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">No signatures found</p>
                            <p className="text-sm text-gray-500">
                                Please go to the Signatures page to upload a signature first.
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Signature Selection */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3">Select Signature</h3>
                                <div className="space-y-3">
                                    {signatures.map((signature) => (
                                        <div
                                            key={signature.id}
                                            onClick={() => {
                                                setSelectedSignature(signature);
                                                setSignatureWidth(signature.width);
                                                setSignatureHeight(signature.height);
                                            }}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                selectedSignature?.id === signature.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-blue-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-800">
                                                    {signature.name}
                                                </span>
                                                {selectedSignature?.id === signature.id && (
                                                    <Check className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>
                                            <img
                                                src={signature.storageUrl}
                                                alt={signature.name}
                                                className="w-full h-20 object-contain bg-white rounded border border-gray-200"
                                            />
                                            {signature.isDefault && (
                                                <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Position & Size Settings */}
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-3">Position & Size</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Page Number
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={pageNumber}
                                            onChange={(e) => setPageNumber(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                X Position (pts)
                                            </label>
                                            <input
                                                type="number"
                                                value={xPosition}
                                                onChange={(e) => setXPosition(Number(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Y Position (pts)
                                            </label>
                                            <input
                                                type="number"
                                                value={yPosition}
                                                onChange={(e) => setYPosition(Number(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Width (optional)
                                            </label>
                                            <input
                                                type="number"
                                                value={signatureWidth || ''}
                                                onChange={(e) => setSignatureWidth(e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="Natural"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Height (optional)
                                            </label>
                                            <input
                                                type="number"
                                                value={signatureHeight || ''}
                                                onChange={(e) => setSignatureHeight(e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="Natural"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm text-blue-800">
                                            <strong>Note:</strong> PDF coordinates start from the bottom-left corner.
                                            Y=0 is at the bottom, Y increases upward.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {signatures.length > 0 && (
                    <div className="flex justify-end gap-3 p-6 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApplySignature}
                            disabled={!selectedSignature || applying}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {applying ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                'Apply Signature'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
