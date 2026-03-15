import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { useThemeStore, ThemeMode } from './store/themeStore';
import ThemeSwitcher from './components/ThemeSwitcher';

// ── Eager load lightweight pages ─────────────────────────────────────────────
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// ── Lazy load heavy, authenticated-only pages ─────────────────────────────────
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const DocumentsPage = lazy(() => import('./pages/Documents'));
const DocumentUploadPage = lazy(() => import('./pages/DocumentUpload'));
const DocumentViewerPage = lazy(() => import('./pages/DocumentViewer'));
const PublicDocumentViewerPage = lazy(() => import('./pages/PublicDocumentViewer'));
const SignaturesPage = lazy(() => import('./pages/Signatures'));
const BillingPage = lazy(() => import('./pages/Billing'));

/** Full-screen loading fallback shown while a lazy chunk loads */
function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                <p className="text-sm text-slate-500">Loading…</p>
            </div>
        </div>
    );
}

/** Redirect unauthenticated users to /login */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <>{children}</>;
}

function App() {
    const { isAuthenticated } = useAuthStore();
    const { mode, setMode } = useThemeStore();
    const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const resolvedMode = useMemo<'light' | 'dark'>(() => {
        if (mode === 'system') return systemPrefersDark ? 'dark' : 'light';
        return mode;
    }, [mode, systemPrefersDark]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = resolvedMode === 'dark';
        root.classList.toggle('dark', isDark);
        root.style.colorScheme = isDark ? 'dark' : 'light';
    }, [resolvedMode]);

    // Redirect authenticated users away from login/register
    const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
        if (isAuthenticated) return <Navigate to="/dashboard" replace />;
        return <>{children}</>;
    };

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <ThemeSwitcher mode={mode} resolvedMode={resolvedMode} onModeChange={(next: ThemeMode) => setMode(next)} />
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
                        <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />

                        {/* Public document viewer — no auth required */}
                        <Route path="/documents/public/:documentId" element={<PublicDocumentViewerPage />} />
                        <Route path="/view/:documentId" element={<PublicDocumentViewerPage />} />

                        {/* Protected routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                        <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
                        <Route path="/documents/upload" element={<ProtectedRoute><DocumentUploadPage /></ProtectedRoute>} />
                        {/* signatures MUST be before :id so 'signatures' is not captured as a document id */}
                        <Route path="/documents/signatures" element={<ProtectedRoute><SignaturesPage /></ProtectedRoute>} />
                        <Route path="/documents/:id" element={<ProtectedRoute><DocumentViewerPage /></ProtectedRoute>} />

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </div>
        </ErrorBoundary>
    );
}

export default App;
