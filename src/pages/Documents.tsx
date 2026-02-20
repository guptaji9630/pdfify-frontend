import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../lib/api';
import { Document, DocumentFilters } from '../types';
import { Upload, FileText, Filter, Search, Download, Trash2, Eye } from 'lucide-react';

export default function DocumentsPage() {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<DocumentFilters>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [filters]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await documentAPI.list(filters);
            // Backend: { data: { documents: [...], pagination: {...} } }
            const raw = response.data?.data?.documents ?? response.data?.data ?? response.data ?? [];
            setDocuments(Array.isArray(raw) ? raw : []);
        } catch (error: any) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            await documentAPI.delete(docId);
            setDocuments(documents.filter((doc) => doc.id !== docId));
        } catch (error: any) {
            console.error('Error deleting document:', error);
            alert('Failed to delete document');
        }
    };

    /**
     * Download via signed GCS URL returned by the backend.
     * Backend returns { data: { downloadUrl, filename, expiresIn } } — open it directly.
     */
    const handleDownload = async (docId: string, title: string) => {
        try {
            const response = await documentAPI.download(docId);
            const downloadUrl = response.data?.data?.downloadUrl;
            if (!downloadUrl) throw new Error('No download URL returned');

            const a = window.document.createElement('a');
            a.href = downloadUrl;
            a.download = `${title}.pdf`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            window.document.body.appendChild(a);
            a.click();
            window.document.body.removeChild(a);
        } catch (error: any) {
            console.error('Error downloading document:', error);
            alert('Failed to download document');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return 'bg-yellow-100 text-yellow-800';
            case 'PUBLISHED':
                return 'bg-green-100 text-green-800';
            case 'ARCHIVED':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    const filteredDocuments = documents.filter((doc) =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        My Documents
                    </h1>
                    <p className="text-slate-600">Manage and organize your documents</p>
                </div>

                {/* Actions Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 w-full lg:w-auto">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                                showFilters
                                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <Filter className="w-5 h-5" />
                            Filters
                        </button>

                        {/* Upload Button */}
                        <button
                            onClick={() => navigate('/documents/upload')}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/30"
                        >
                            <Upload className="w-5 h-5" />
                            Upload
                        </button>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={filters.status || ''}
                                        onChange={(e) =>
                                            setFilters({ ...filters, status: e.target.value as any })
                                        }
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="DRAFT">Draft</option>
                                        <option value="PUBLISHED">Published</option>
                                        <option value="ARCHIVED">Archived</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Type
                                    </label>
                                    <select
                                        value={filters.type || ''}
                                        onChange={(e) =>
                                            setFilters({ ...filters, type: e.target.value as any })
                                        }
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Types</option>
                                        <option value="PDF">PDF</option>
                                        <option value="DOC">DOC</option>
                                        <option value="DOCX">DOCX</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Tags
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="invoice, contract..."
                                        value={filters.tags || ''}
                                        onChange={(e) =>
                                            setFilters({ ...filters, tags: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setFilters({})}
                                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Documents Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                            No documents found
                        </h3>
                        <p className="text-slate-500 mb-6">
                            Get started by uploading your first document
                        </p>
                        <button
                            onClick={() => navigate('/documents/upload')}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            Upload Document
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                            >
                                {/* Document Thumbnail */}
                                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
                                    {doc.thumbnailUrl ? (
                                        <img
                                            src={doc.thumbnailUrl}
                                            alt={doc.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FileText className="w-20 h-20 text-blue-300" />
                                    )}
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                                doc.status
                                            )}`}
                                        >
                                            {doc.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Document Info */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-semibold text-lg text-slate-800 line-clamp-2 flex-1">
                                            {doc.title}
                                        </h3>
                                        <span className="ml-2 px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                                            {doc.type}
                                        </span>
                                    </div>

                                    {doc.description && (
                                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                            {doc.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                        <span>{doc.pageCount} pages</span>
                                        <span>•</span>
                                        <span>{(doc.size / 1024).toFixed(0)} KB</span>
                                    </div>

                                    {doc.tags && doc.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {doc.tags.slice(0, 3).map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {doc.tags.length > 3 && (
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs">
                                                    +{doc.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => navigate(`/documents/${doc.id}`)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc.id, doc.title)}
                                            className="px-3 py-2 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="px-3 py-2 border-2 border-slate-200 rounded-lg hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                        <span>
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </span>
                                        {doc._count && (
                                            <span>{doc._count.versions} versions</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
