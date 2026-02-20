import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../lib/api';
import { Signature } from '../types';
import { ArrowLeft, Upload, Trash2, Check, PenTool } from 'lucide-react';

export default function SignaturesPage() {
    const navigate = useNavigate();
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchSignatures();
    }, []);

    const fetchSignatures = async () => {
        try {
            setLoading(true);
            const response = await documentAPI.listSignatures();
            // Backend may return { data: [...] } or { signatures: [...] } or a plain array
            const raw = response.data?.data ?? response.data?.signatures ?? response.data ?? [];
            setSignatures(Array.isArray(raw) ? raw : []);
        } catch (error: any) {
            console.error('Error fetching signatures:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File) => {
        const name = prompt('Enter a name for this signature:');
        if (!name) return;

        setUploading(true);

        try {
            await documentAPI.uploadSignature(file, name, signatures.length === 0);
            await fetchSignatures();
            alert('Signature uploaded successfully!');
        } catch (error: any) {
            console.error('Error uploading signature:', error);
            alert(error.response?.data?.error || 'Failed to upload signature');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleSetDefault = async (signatureId: string) => {
        try {
            await documentAPI.setDefaultSignature(signatureId);
            await fetchSignatures();
        } catch (error: any) {
            console.error('Error setting default signature:', error);
            alert('Failed to set default signature');
        }
    };

    const handleDelete = async (signatureId: string) => {
        if (!confirm('Are you sure you want to delete this signature?')) return;

        try {
            await documentAPI.deleteSignature(signatureId);
            setSignatures(signatures.filter((sig) => sig.id !== signatureId));
        } catch (error: any) {
            console.error('Error deleting signature:', error);
            alert('Failed to delete signature');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                My Signatures
                            </h1>
                            <p className="text-slate-600">
                                Manage your digital signatures for document signing
                            </p>
                        </div>

                        <label
                            htmlFor="signature-upload"
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/30 cursor-pointer"
                        >
                            <Upload className="w-5 h-5" />
                            {uploading ? 'Uploading...' : 'Upload Signature'}
                        </label>
                        <input
                            id="signature-upload"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={uploading}
                        />
                    </div>
                </div>

                {/* Upload Instructions */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <PenTool className="w-5 h-5 text-blue-600" />
                        How to create your signature
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-slate-700">
                        <li>Sign on a white paper with a black or blue pen</li>
                        <li>Take a clear photo or scan the signature</li>
                        <li>Crop the image to show only the signature</li>
                        <li>Upload here (PNG or JPEG format, max 2MB)</li>
                    </ol>
                    <p className="mt-4 text-sm text-slate-600">
                        <strong>Tip:</strong> Use a transparent background PNG for best results
                    </p>
                </div>

                {/* Signatures Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                ) : signatures.length === 0 ? (
                    <div className="text-center py-20">
                        <PenTool className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                            No signatures yet
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Upload your first signature to start signing documents
                        </p>
                        <label
                            htmlFor="signature-upload-empty"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                        >
                            <Upload className="w-5 h-5" />
                            Upload Signature
                        </label>
                        <input
                            id="signature-upload-empty"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={uploading}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {signatures.map((signature) => (
                            <div
                                key={signature.id}
                                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                                    signature.isDefault ? 'ring-2 ring-blue-500' : ''
                                }`}
                            >
                                {/* Signature Image */}
                                <div className="h-48 bg-slate-50 flex items-center justify-center p-6 relative">
                                    <img
                                        src={signature.storageUrl}
                                        alt={signature.name}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                    {signature.isDefault && (
                                        <div className="absolute top-3 right-3">
                                            <span className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
                                                <Check className="w-3 h-3" />
                                                Default
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Signature Info */}
                                <div className="p-6">
                                    <h3 className="font-semibold text-lg text-slate-800 mb-3">
                                        {signature.name}
                                    </h3>

                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                                        <span>
                                            {signature.width} × {signature.height}px
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {new Date(signature.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {!signature.isDefault && (
                                            <button
                                                onClick={() => handleSetDefault(signature.id)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                                Set Default
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(signature.id)}
                                            className={`${
                                                signature.isDefault ? 'flex-1' : ''
                                            } flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition-colors`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>

                                    {/* Usage Info */}
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500">
                                            {signature.isDefault
                                                ? 'This is your default signature'
                                                : 'Set as default to use by default when signing'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tips Section */}
                {signatures.length > 0 && (
                    <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="font-semibold text-slate-800 mb-4">
                            💡 Signature Usage Tips
                        </h3>
                        <ul className="space-y-2 text-slate-600">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>
                                    Your default signature will be used automatically when quick-signing
                                    documents
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>
                                    You can apply multiple signatures to different pages of the same
                                    document
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>
                                    Signatures are stored securely and can be used across all your
                                    documents
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>
                                    For best quality, use high-resolution images with transparent
                                    backgrounds
                                </span>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
