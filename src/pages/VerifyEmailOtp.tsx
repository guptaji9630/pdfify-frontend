import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import MaintenancePage from '../components/MaintenancePage';
import ThemeToggle from '../components/ThemeSwitcher';

const IS_MAINTENANCE = false;

interface VerifyEmailLocationState {
    email?: string;
    resendAvailableInSeconds?: number;
}

export default function VerifyEmailOtpPage() {
    if (IS_MAINTENANCE) return <MaintenancePage />;

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);

    const state = location.state as VerifyEmailLocationState | null;
    const initialEmailFromState = state?.email || searchParams.get('email') || '';
    const initialCooldownFromQuery = Number(searchParams.get('resend') || 0);
    const initialCooldown =
        state?.resendAvailableInSeconds || (Number.isFinite(initialCooldownFromQuery) ? initialCooldownFromQuery : 0);

    const [email, setEmail] = useState(initialEmailFromState);
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(initialCooldown);

    useEffect(() => {
        if (!resendCountdown || resendCountdown <= 0) return;

        const timer = window.setInterval(() => {
            setResendCountdown((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [resendCountdown]);

    const isEmailEditable = useMemo(() => !initialEmailFromState, [initialEmailFromState]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Email is required.');
            return;
        }

        if (!otp.trim()) {
            setError('Please enter the OTP sent to your email.');
            return;
        }

        setVerifyLoading(true);
        try {
            const response = await authAPI.verifyEmailOtp(email.trim(), otp.trim());
            const { token, user } = response.data;

            setSuccess('Email verified successfully. Redirecting...');
            setAuth(user, token);
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 429) {
                setError(
                    err.response?.data?.error ||
                        'Maximum OTP attempts exceeded. Please request a new OTP.'
                );
            } else if (status === 400) {
                setError(
                    err.response?.data?.error ||
                        err.response?.data?.message ||
                        'Invalid or expired OTP. Please try again.'
                );
            } else {
                setError(
                    err.response?.data?.error ||
                        err.response?.data?.message ||
                        err.message ||
                        'Unable to verify OTP. Please try again.'
                );
            }
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Enter your email before requesting a new OTP.');
            return;
        }

        setResendLoading(true);
        try {
            const response = await authAPI.resendEmailOtp(email.trim());
            const cooldown = response.data?.data?.resendAvailableInSeconds || 0;
            setResendCountdown(cooldown);
            setSuccess(response.data?.message || 'OTP sent successfully.');
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 429) {
                const retryAfterSeconds =
                    err.response?.data?.data?.retryAfterSeconds ||
                    err.response?.data?.data?.resendAvailableInSeconds ||
                    0;
                if (retryAfterSeconds > 0) {
                    setResendCountdown(retryAfterSeconds);
                }
                setError(
                    err.response?.data?.error ||
                        `Please wait ${retryAfterSeconds} seconds before requesting a new OTP.`
                );
            } else {
                setError(
                    err.response?.data?.error ||
                        err.response?.data?.message ||
                        err.message ||
                        'Failed to resend OTP. Please try again.'
                );
            }
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex justify-end p-3">
                <ThemeToggle />
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-700">
                    <h1 className="text-3xl font-bold text-center mb-2">
                        Verify your{' '}
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            email
                        </span>
                    </h1>
                    <p className="text-center text-sm text-slate-500 mb-6">
                        Enter the 6-digit OTP sent to your inbox.
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-4">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="you@example.com"
                                required
                                disabled={!isEmailEditable}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full px-4 py-2 border rounded-lg tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="123456"
                                required
                                inputMode="numeric"
                                maxLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={verifyLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {verifyLoading ? 'Verifying...' : 'Verify Email'}
                        </button>
                    </form>

                    <div className="mt-4 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendLoading || resendCountdown > 0}
                            className="text-blue-600 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                            {resendLoading
                                ? 'Sending...'
                                : resendCountdown > 0
                                  ? `Resend OTP in ${resendCountdown}s`
                                  : 'Resend OTP'}
                        </button>

                        <Link to="/login" className="text-sm text-slate-600 hover:text-slate-800">
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
