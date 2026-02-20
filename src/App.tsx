import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import DocumentsPage from './pages/Documents';
import DocumentUploadPage from './pages/DocumentUpload';
import DocumentViewerPage from './pages/DocumentViewer';
import SignaturesPage from './pages/Signatures';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    
                    {/* Document Management Routes */}
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/documents/upload" element={<DocumentUploadPage />} />
                    {/* signatures MUST be before :id so it isn't captured as id="signatures" */}
                    <Route path="/documents/signatures" element={<SignaturesPage />} />
                    <Route path="/documents/:id" element={<DocumentViewerPage />} />
                </Routes>
            </div>
        </ErrorBoundary>
    );
}

export default App;
