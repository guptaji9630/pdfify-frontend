import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';

// ── Eager load lightweight pages ─────────────────────────────────────────────
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// ── Lazy load heavy, authenticated-only pages ─────────────────────────────────
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const DocumentsPage = lazy(() => import('./pages/Documents'));
const DocumentUploadPage = lazy(() => import('./pages/DocumentUpload'));
const DocumentViewerPage = lazy(() => import('./pages/DocumentViewer'));
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

    // Redirect authenticated users away from login/register
    const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
        if (isAuthenticated) return <Navigate to="/dashboard" replace />;
        return <>{children}</>;
    };

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
                        <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />

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
