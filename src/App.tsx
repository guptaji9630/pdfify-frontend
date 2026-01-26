import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import MergePage from './pages/tools/Merge';
import CompressPage from './pages/tools/Compress';
import SplitPage from './pages/tools/Split';

function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tools/merge" element={<MergePage />} />
                <Route path="/tools/compress" element={<CompressPage />} />
                <Route path="/tools/split" element={<SplitPage />} />
            </Routes>
        </div>
    );
}

export default App;
