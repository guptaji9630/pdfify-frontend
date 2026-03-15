import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
    Download, Globe, Loader2, FileText, AlertCircle, RefreshCw,
    ChevronDown, ExternalLink,
} from 'lucide-react';
import ThemeToggle from '../components/ThemeSwitcher';
import { publicDocumentAPI } from '../lib/api';
import { Document } from '../types';

// Refresh viewUrl 1 minute before the 15-minute expiry
const VIEW_URL_REFRESH_MS = 14 * 60 * 1000;

interface AccessFlags {
    canEdit: boolean;
    canTranslate: boolean;
}

// ─── Language list (subset — server returns authoritative list) ───────────────
const COMMON_LANGUAGES = [
    'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean',
    'Arabic', 'Russian', 'Hindi', 'Turkish', 'Dutch', 'Polish',
    'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Greek',
];

const CREATOR_NAME = 'Abhishek';
const CREATOR_INITIALS = 'AB';
const CREATOR_PORTFOLIO_URL = 'https://gggoku.tech/';

export default function PublicDocumentViewer() {
    const { documentId } = useParams<{ documentId: string }>();

    // ── Core state ────────────────────────────────────────────────────────────
    const [document, setDocument] = useState<Document | null>(null);
    const [access, setAccess] = useState<AccessFlags>({ canEdit: false, canTranslate: false });
    const [viewUrl, setViewUrl] = useState<string>('');
    const [iframeKey, setIframeKey] = useState(0);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    // ── Translate state ───────────────────────────────────────────────────────
    const [showTranslate, setShowTranslate] = useState(false);
    const [selectedLang, setSelectedLang] = useState('Spanish');
    const [customLang, setCustomLang] = useState('');
    const [translating, setTranslating] = useState(false);
    const [translateResult, setTranslateResult] = useState<string | null>(null);
    const [translateError, setTranslateError] = useState<string | null>(null);

    // ── viewUrl auto-refresh ───────────────────────────────────────────────────
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleRefresh = useCallback(() => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(async () => {
            if (!documentId) return;
            try {
                const res = await publicDocumentAPI.getPublic(documentId);
                setViewUrl(res.data.viewUrl);
                setIframeKey(k => k + 1);
                scheduleRefresh();
            } catch {
                // silently ignore — user can manually reload
            }
        }, VIEW_URL_REFRESH_MS);
    }, [documentId]);

    // ── Initial load ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!documentId) {
            setError('No document ID provided.');
            setLoading(false);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const res = await publicDocumentAPI.getPublic(documentId);
                if (cancelled) return;
                setDocument(res.data.document);
                setAccess(res.data.access);
                setViewUrl(res.data.viewUrl);
                scheduleRefresh();
            } catch (err: any) {
                if (!cancelled) setError(err?.message ?? 'Failed to load document.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, [documentId, scheduleRefresh]);

    // ── Action handlers ───────────────────────────────────────────────────────

    const handleDownload = async () => {
        if (!documentId) return;
        try {
            setDownloading(true);
            await publicDocumentAPI.downloadPublic(documentId);
        } catch (err: any) {
            alert(`Download failed: ${err?.message ?? 'Unknown error'}`);
        } finally {
            setDownloading(false);
        }
    };

    const handleTranslate = async () => {
        if (!documentId) return;
        const lang = customLang.trim() || selectedLang;
        if (!lang) return;

        try {
            setTranslating(true);
            setTranslateError(null);
            setTranslateResult(null);
            const json = await publicDocumentAPI.translatePublic(documentId, lang);
            // Backend returns { data: { translatedText } } or similar shape
            const text: string =
                json?.data?.translatedText ??
                json?.data?.text ??
                json?.translatedText ??
                JSON.stringify(json?.data ?? json, null, 2);
            setTranslateResult(text);
        } catch (err: any) {
            setTranslateError(err?.message ?? 'Translation failed. Please try again.');
        } finally {
            setTranslating(false);
        }
    };

    // ── Render helpers ────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                    <p className="text-slate-500 dark:text-slate-300 text-sm">Loading document…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-transparent dark:border-slate-700">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Document Unavailable</h2>
                    <p className="text-slate-500 dark:text-slate-300 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors mx-auto"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* ── Top toolbar ─────────────────────────────────────────────── */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
                    {/* Branding / title */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">
                            {document?.title ?? 'Shared Document'}
                        </span>
                        {document?.pageCount && (
                            <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                                · {document.pageCount} pages
                            </span>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <ThemeToggle />
                        {/* Translate — only when access.canTranslate */}
                        {access.canTranslate && (
                            <button
                                onClick={() => setShowTranslate(v => !v)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    showTranslate
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <Globe className="w-4 h-4" />
                                <span className="hidden sm:inline">Translate</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${showTranslate ? 'rotate-180' : ''}`} />
                            </button>
                        )}

                        {/* Download — always visible */}
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                            {downloading
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Download className="w-4 h-4" />
                            }
                            <span className="hidden sm:inline">Download</span>
                        </button>
                    </div>
                </div>

                {/* ── Translate dropdown panel ───────────────────────────── */}
                {showTranslate && access.canTranslate && (
                    <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-4 py-3">
                        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-shrink-0">
                                Translate to:
                            </span>
                            <select
                                value={selectedLang}
                                onChange={e => { setSelectedLang(e.target.value); setCustomLang(''); }}
                                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-slate-100"
                            >
                                {COMMON_LANGUAGES.map(l => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                                <option value="">Other (type below)</option>
                            </select>
                            {selectedLang === '' && (
                                <input
                                    type="text"
                                    placeholder="Enter language…"
                                    value={customLang}
                                    onChange={e => setCustomLang(e.target.value)}
                                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-slate-100 w-40"
                                />
                            )}
                            <button
                                onClick={handleTranslate}
                                disabled={translating || (!customLang && !selectedLang)}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                            >
                                {translating
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Translating…</>
                                    : <><Globe className="w-4 h-4" /> Translate</>
                                }
                            </button>
                        </div>

                        {/* Result / error */}
                        {translateError && (
                            <div className="max-w-7xl mx-auto mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                                {translateError}
                            </div>
                        )}
                        {translateResult && (
                            <div className="max-w-7xl mx-auto mt-3">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 max-h-64 overflow-y-auto">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                            Translation — {customLang || selectedLang}
                                        </span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(translateResult)}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                                        {translateResult}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* ── PDF viewer ──────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col items-center py-6 px-4">
                <div
                    className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
                    style={{ height: 'calc(100vh - 88px)' }}
                >
                    {viewUrl ? (
                        <iframe
                            key={iframeKey}
                            src={`${viewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                            title={document?.title ?? 'Shared PDF'}
                            width="100%"
                            height="100%"
                            frameBorder={0}
                            style={{ border: 'none', outline: 'none', boxShadow: 'none', background: '#fff', display: 'block' }}
                            allow="fullscreen"
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <FileText className="w-16 h-16" />
                        </div>
                    )}
                </div>

                {/* Professional creator signature */}
                <div className="mt-4 w-full max-w-4xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center text-xs font-bold tracking-wide">
                            {CREATOR_INITIALS}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                Project by {CREATOR_NAME}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                Crafted for fast, clean document collaboration
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                            href={CREATOR_PORTFOLIO_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Portfolio
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <a
                            href="/"
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                            Powered by PDFify
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
