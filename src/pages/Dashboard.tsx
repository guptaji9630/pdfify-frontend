import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import MergePdfModal from '../components/MergePdfModal';
import CompressPdfModal from '../components/CompressPdfModal';
import SplitPdfModal from '../components/SplitPdfModal';
import ClassifyPdfModal from '../components/ClassifyPdfModal';
import SummarizePdfModal from '../components/SummarizePdfModal';
import ExtractDataModal from '../components/ExtractDataModal';
import TranslatePdfModal from '../components/TranslatePdfModal';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();
    const [mergeModalOpen, setMergeModalOpen] = useState(false);
    const [compressModalOpen, setCompressModalOpen] = useState(false);
    const [splitModalOpen, setSplitModalOpen] = useState(false);
    const [classifyModalOpen, setClassifyModalOpen] = useState(false);
    const [summarizeModalOpen, setSummarizeModalOpen] = useState(false);
    const [extractDataModalOpen, setExtractDataModalOpen] = useState(false);
    const [translateModalOpen, setTranslateModalOpen] = useState(false);
    const [preSelectedFile, setPreSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleActionSelect = (action: string, file: File) => {
        setPreSelectedFile(file);
        
        // Map actions to modals
        const actionLower = action.toLowerCase();
        
        if (actionLower === 'summarize') {
            setSummarizeModalOpen(true);
        } else if (actionLower === 'extract data' || actionLower === 'extract_data') {
            setExtractDataModalOpen(true);
        } else if (actionLower === 'translate') {
            setTranslateModalOpen(true);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen">
            <header className="bg-white border-b">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        PDFify
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600">{user.email}</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {user.subscription?.plan || 'FREE'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-slate-600 hover:text-slate-900"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <h2 className="text-3xl font-bold mb-8">Welcome back, {user.name || 'User'}!</h2>

                {/* Document Management Section */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Document Management</h3>
                    <div 
                        onClick={() => navigate('/documents')}
                        className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-white"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-4xl mb-4">📁</div>
                                <h3 className="text-2xl font-bold mb-2">My Documents</h3>
                                <p className="text-white/90 mb-4">
                                    Manage, edit, sign, and organize all your documents in one place
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                        ✓ Upload & Create
                                    </span>
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                        ✓ Digital Signatures
                                    </span>
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                        ✓ Version Control
                                    </span>
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                        ✓ Annotations
                                    </span>
                                </div>
                            </div>
                            <div className="text-6xl">→</div>
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-semibold mb-4">PDF Tools</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div 
                        onClick={() => setMergeModalOpen(true)}
                        className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    >
                        <div className="text-4xl mb-4">📄</div>
                        <h3 className="text-xl font-bold mb-2">Merge PDFs</h3>
                        <p className="text-slate-600">Combine multiple PDFs into one</p>
                    </div>

                    <div 
                        onClick={() => setCompressModalOpen(true)}
                        className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    >
                        <div className="text-4xl mb-4">⚡</div>
                        <h3 className="text-xl font-bold mb-2">Compress PDF</h3>
                        <p className="text-slate-600">Reduce file size intelligently</p>
                    </div>

                    <div 
                        onClick={() => setSplitModalOpen(true)}
                        className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    >
                        <div className="text-4xl mb-4">✂️</div>
                        <h3 className="text-xl font-bold mb-2">Split PDF</h3>
                        <p className="text-slate-600">Extract specific pages</p>
                    </div>

                    {/* AI Features - Premium Only */}
                    {user.subscription?.plan && user.subscription.plan !== 'FREE' && (
                        <>
                            <div 
                                onClick={() => setClassifyModalOpen(true)}
                                className="bg-gradient-to-br from-purple-500 to-blue-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-white"
                            >
                                <div className="text-4xl mb-4">🤖</div>
                                <h3 className="text-xl font-bold mb-2">AI Classify</h3>
                                <p className="text-white/90">Auto-detect document type</p>
                            </div>

                            <div 
                                onClick={() => setSummarizeModalOpen(true)}
                                className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-white"
                            >
                                <div className="text-4xl mb-4">📝</div>
                                <h3 className="text-xl font-bold mb-2">AI Summarize</h3>
                                <p className="text-white/90">Get instant summaries</p>
                            </div>
                        </>
                    )}

                    {/* Upgrade Card - Free Users Only */}
                    {(!user.subscription?.plan || user.subscription.plan === 'FREE') && (
                        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-white">
                            <div className="text-4xl mb-4">⭐</div>
                            <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
                            <p className="text-white/90">Unlock AI features for ₹99/mo</p>
                            <ul className="mt-3 space-y-1 text-sm text-white/80">
                                <li>✓ AI Document Classification</li>
                                <li>✓ AI Summarization</li>
                                <li>✓ AI Data Extraction</li>
                                <li>✓ AI Translation (27+ languages)</li>
                            </ul>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <MergePdfModal 
                isOpen={mergeModalOpen} 
                onClose={() => setMergeModalOpen(false)} 
            />
            <CompressPdfModal 
                isOpen={compressModalOpen} 
                onClose={() => setCompressModalOpen(false)} 
            />
            <SplitPdfModal 
                isOpen={splitModalOpen} 
                onClose={() => setSplitModalOpen(false)} 
            />
            <ClassifyPdfModal 
                isOpen={classifyModalOpen} 
                onClose={() => setClassifyModalOpen(false)}
                onActionSelect={handleActionSelect}
            />
            <SummarizePdfModal 
                isOpen={summarizeModalOpen} 
                onClose={() => {
                    setSummarizeModalOpen(false);
                    setPreSelectedFile(null);
                }}
                preSelectedFile={preSelectedFile}
            />
            <ExtractDataModal 
                isOpen={extractDataModalOpen} 
                onClose={() => {
                    setExtractDataModalOpen(false);
                    setPreSelectedFile(null);
                }}
                preSelectedFile={preSelectedFile}
            />
            <TranslatePdfModal 
                isOpen={translateModalOpen} 
                onClose={() => {
                    setTranslateModalOpen(false);
                    setPreSelectedFile(null);
                }}
                preSelectedFile={preSelectedFile}
            />
        </div>
    );
}
