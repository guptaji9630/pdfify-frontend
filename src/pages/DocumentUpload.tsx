import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../lib/api';
import { Upload, FileText, X, Plus, ArrowLeft } from 'lucide-react';

export default function DocumentUploadPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'upload' | 'create'>('upload');

    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadTags, setUploadTags] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Create state
    const [createData, setCreateData] = useState({
        title: '',
        description: '',
        type: 'PDF' as 'PDF' | 'DOC' | 'DOCX',
        content: '',
        tags: '',
        isPublic: false,
    });
    const [creating, setCreating] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            if (!uploadTitle) {
                setUploadTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
            }
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);

        try {
            const tags = uploadTags.split(',').map((t) => t.trim()).filter(Boolean);
            const response = await documentAPI.upload(file, uploadTitle, isPublic, tags);
            
            alert('Document uploaded successfully!');
            navigate(`/documents/${response.data.data.id}`);
        } catch (error: any) {
            console.error('Error uploading document:', error);
            alert(error.response?.data?.error || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        setCreating(true);

        try {
            const tags = createData.tags.split(',').map((t) => t.trim()).filter(Boolean);
            const response = await documentAPI.create({
                ...createData,
                tags,
            });

            alert('Document created successfully!');
            navigate(`/documents/${response.data.data.id}`);
        } catch (error: any) {
            console.error('Error creating document:', error);
            alert(error.response?.data?.error || 'Failed to create document');
        } finally {
            setCreating(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setUploadTitle('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/documents')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Documents
                </button>

                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Add New Document
                    </h1>
                    <p className="text-slate-600">Upload an existing file or create a new one</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                                activeTab === 'upload'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Upload className="w-5 h-5" />
                                Upload File
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                                activeTab === 'create'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Plus className="w-5 h-5" />
                                Create New
                            </div>
                        </button>
                    </div>

                    <div className="p-8">
                        {activeTab === 'upload' ? (
                            /* Upload Form */
                            <form onSubmit={handleUpload} className="space-y-6">
                                {/* File Upload Area */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Select File
                                    </label>
                                    {!file ? (
                                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                                <p className="text-lg font-semibold text-slate-700 mb-2">
                                                    Click to upload or drag and drop
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    PDF, DOC, or DOCX (Max 10MB)
                                                </p>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-blue-500 rounded-xl p-6 bg-blue-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-blue-100 rounded-lg">
                                                        <FileText className="w-8 h-8 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={clearFile}
                                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <X className="w-5 h-5 text-red-600" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Document Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="My Document"
                                        required
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={uploadTags}
                                        onChange={(e) => setUploadTags(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="invoice, contract, 2025"
                                    />
                                </div>

                                {/* Public Toggle */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="public-upload"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="public-upload" className="text-sm text-slate-700">
                                        Make this document public
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={!file || uploading}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                                >
                                    {uploading ? 'Uploading...' : 'Upload Document'}
                                </button>
                            </form>
                        ) : (
                            /* Create Form */
                            <form onSubmit={handleCreate} className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Document Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.title}
                                        onChange={(e) =>
                                            setCreateData({ ...createData, title: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Untitled Document"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.description}
                                        onChange={(e) =>
                                            setCreateData({
                                                ...createData,
                                                description: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Optional description"
                                    />
                                </div>

                                {/* Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Document Type
                                    </label>
                                    <select
                                        value={createData.type}
                                        onChange={(e) =>
                                            setCreateData({
                                                ...createData,
                                                type: e.target.value as any,
                                            })
                                        }
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="PDF">PDF</option>
                                        <option value="DOC">DOC</option>
                                        <option value="DOCX">DOCX</option>
                                    </select>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Initial Content *
                                    </label>
                                    <textarea
                                        value={createData.content}
                                        onChange={(e) =>
                                            setCreateData({ ...createData, content: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={10}
                                        placeholder="Start typing your document content..."
                                        required
                                    />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={createData.tags}
                                        onChange={(e) =>
                                            setCreateData({ ...createData, tags: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="draft, personal, 2025"
                                    />
                                </div>

                                {/* Public Toggle */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="public-create"
                                        checked={createData.isPublic}
                                        onChange={(e) =>
                                            setCreateData({
                                                ...createData,
                                                isPublic: e.target.checked,
                                            })
                                        }
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="public-create" className="text-sm text-slate-700">
                                        Make this document public
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                                >
                                    {creating ? 'Creating...' : 'Create Document'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
