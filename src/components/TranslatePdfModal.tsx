import { useState, useEffect } from 'react';
import { aiAPI, documentAPI } from '../lib/api';

interface TranslatePdfModalProps {
    isOpen: boolean;
    onClose: () => void;
    preSelectedFile?: File | null;
    documentId?: string;  // NEW: Support for stored documents
}

export default function TranslatePdfModal({ isOpen, onClose, preSelectedFile, documentId }: TranslatePdfModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [targetLanguage, setTargetLanguage] = useState('Spanish');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
    const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
    const [loadingLanguages, setLoadingLanguages] = useState(true);

    // Fetch supported languages
    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await aiAPI.getSupportedLanguages();
                if (response.data.success && response.data.data) {
                    setSupportedLanguages(response.data.data.languages);
                } else if (response.data.languages) {
                    setSupportedLanguages(response.data.languages);
                }
            } catch (err) {
                console.error('Failed to load languages:', err);
                // Fallback to default languages
                setSupportedLanguages(['Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Hindi']);
            } finally {
                setLoadingLanguages(false);
            }
        };
        fetchLanguages();
    }, []);

    useEffect(() => {
        if (isOpen && preSelectedFile) {
            setFile(preSelectedFile);
        }
    }, [isOpen, preSelectedFile]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setError('');
            setTranslatedText(null);
        }
    };

    const handleTranslate = async () => {
        if (documentId) {
            await handleTranslateDocument();
        } else if (file) {
            await handleTranslateFile();
        } else {
            setError('Please select a PDF file');
        }
    };

    // NEW: Translate stored document
    const handleTranslateDocument = async () => {
        if (!documentId) return;

        setLoading(true);
        setError('');

        try {
            const response = await documentAPI.translateDocument(documentId, targetLanguage);
            console.log('Translate Document API Response:', response);

            let data = response.data;
            if (data.success && data.data) {
                data = data.data;
            }

            setTranslatedText(data.translatedText || data.text);
            setDetectedLanguage(data.originalLanguage || data.sourceLanguage);
        } catch (err: any) {
            console.error('Translation error:', err);
            setError(err.response?.data?.error || 'Failed to translate document');
        } finally {
            setLoading(false);
        }
    };

    const handleTranslateFile = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        try {
            const response = await aiAPI.translate(file, targetLanguage, 'text');
            console.log('Translate API Response:', response);

            let data = response;
            if (response.success && response.data) {
                data = response.data;
            }

            const translated = data.translatedText || data.text || '';
            
            // Check if translation is empty
            if (!translated || translated.trim() === '') {
                throw new Error(
                    `Translation completed but no text returned. Backend returned: ${JSON.stringify(data)}`
                );
            }
            
            setTranslatedText(translated);
            setDetectedLanguage(data.originalLanguage || data.detectedLanguage || data.sourceLanguage);
        } catch (err: any) {
            console.error('Translation error:', err);
            console.error('Error response:', err.response?.data);
            
            let errorMessage = 'Failed to translate document';
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setTranslatedText(null);
        setDetectedLanguage(null);
        setError('');
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleCopy = () => {
        if (translatedText) {
            navigator.clipboard.writeText(translatedText);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">🌍 AI Document Translation</h2>
                    <button
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {!translatedText ? (
                        <>
                            {!preSelectedFile && !documentId && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Select PDF file
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        AI will translate your document to the selected language
                                    </p>
                                </div>
                            )}

                            {documentId && (
                                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-cyan-700">
                                        📄 Translating stored document
                                    </p>
                                </div>
                            )}

                            {preSelectedFile && !documentId && (
                                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                                    <p className="text-sm font-medium text-cyan-700 mb-1">
                                        📄 Auto-selected from classification:
                                    </p>
                                    <p className="text-sm text-cyan-600">{file?.name}</p>
                                </div>
                            )}

                            {file && !preSelectedFile && (
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-sm font-medium text-slate-700 mb-1">Selected file:</p>
                                    <p className="text-sm text-slate-600">{file.name}</p>
                                </div>
                            )}

                            {/* Language Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Target Language
                                </label>
                                {loadingLanguages ? (
                                    <div className="text-sm text-slate-500">Loading languages...</div>
                                ) : (
                                    <select
                                        value={targetLanguage}
                                        onChange={(e) => setTargetLanguage(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        disabled={loading}
                                    >
                                        {supportedLanguages.map((lang) => (
                                            <option key={lang} value={lang}>
                                                {lang}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={handleTranslate}
                                    disabled={loading || (!file && !documentId) || loadingLanguages}
                                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Translating...
                                        </span>
                                    ) : (
                                        '🌍 Translate Document'
                                    )}
                                </button>
                                <button
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:text-slate-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100 p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Translated Text</h3>
                                        {detectedLanguage && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Detected source: {detectedLanguage}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="px-3 py-1.5 text-sm text-cyan-600 hover:bg-cyan-100 bg-white rounded-lg transition-colors shadow-sm"
                                    >
                                        📋 Copy
                                    </button>
                                </div>

                                <div className="bg-white rounded-lg p-4 shadow-sm max-h-96 overflow-y-auto">
                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {translatedText}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-cyan-700"
                                >
                                    Translate Another
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 text-slate-600 hover:text-slate-800"
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
