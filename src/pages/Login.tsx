import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(email, password);
            const { token, user } = response.data;

            setAuth(user, token);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-8">
                    Welcome to{' '}
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        PDFify
                    </span>
                </h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="text-center mt-6 text-slate-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
