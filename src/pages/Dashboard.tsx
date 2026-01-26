import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
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

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                        <div className="text-4xl mb-4">📄</div>
                        <h3 className="text-xl font-bold mb-2">Merge PDFs</h3>
                        <p className="text-slate-600">Combine multiple PDFs into one</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                        <div className="text-4xl mb-4">⚡</div>
                        <h3 className="text-xl font-bold mb-2">Compress PDF</h3>
                        <p className="text-slate-600">Reduce file size intelligently</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                        <div className="text-4xl mb-4">✂️</div>
                        <h3 className="text-xl font-bold mb-2">Split PDF</h3>
                        <p className="text-slate-600">Extract specific pages</p>
                    </div>

                    {user.subscription?.plan !== 'FREE' && (
                        <>
                            <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-white">
                                <div className="text-4xl mb-4">🤖</div>
                                <h3 className="text-xl font-bold mb-2">AI Classify</h3>
                                <p className="text-white/90">Auto-detect document type</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-white">
                                <div className="text-4xl mb-4">📝</div>
                                <h3 className="text-xl font-bold mb-2">AI Summarize</h3>
                                <p className="text-white/90">Get instant summaries</p>
                            </div>
                        </>
                    )}

                    {user.subscription?.plan === 'FREE' && (
                        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-white">
                            <div className="text-4xl mb-4">⭐</div>
                            <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
                            <p className="text-white/90">Unlock AI features for ₹99/mo</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
