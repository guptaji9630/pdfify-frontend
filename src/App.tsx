import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import DocumentsPage from './pages/Documents';
import DocumentUploadPage from './pages/DocumentUpload';
import DocumentViewerPage from './pages/DocumentViewer';
import SignaturesPage from './pages/Signatures';
import BillingPage from './pages/Billing';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';

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
            </div>
        </ErrorBoundary>
    );
}

export default App;
