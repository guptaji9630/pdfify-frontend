import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Download, Edit3, MousePointer, Type, Square, Circle,
    Minus, Image as ImageIcon, PenTool, Trash2, Check, X,
    ChevronLeft, ChevronRight, Layers, Palette, AlignLeft, Loader2,
    ArrowRight, Sparkles, Brain, FileText, List, Globe, Lightbulb,
    MessageSquare, Copy, ChevronDown, ChevronUp, Tag, History, RotateCcw, Clock,
} from 'lucide-react';
import { documentAPI, aiAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Document, Signature } from '../types';

// ─── Local Types ─────────────────────────────────────────────────────────────

type ToolType = 'select' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'image' | 'signature';
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface CanvasElement {
    id: string;
    type: 'text' | 'rectangle' | 'circle' | 'line' | 'arrow' | 'image' | 'signature';
    /** CSS pixels relative to overlay origin (top-left of the page) */
    x: number;
    y: number;
    width: number;
    height: number;
    // Style
    color: string;
    fillColor: string;
    lineWidth: number;
    // Text
    text?: string;
    fontSize?: number;
    // Image
    imageFile?: File;
    imagePreviewUrl?: string;
    // Signature
    signatureId?: string;
    signatureUrl?: string;
    // State
    committed: boolean;
}

interface PageInfo {
    pageNumber: number;
    width: number;
    height: number;
    rotation?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

/** Width we render each page at (CSS px). A4 at ~96 DPI */
const VIEWER_WIDTH = 794;
const HANDLE_PX = 8;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentViewerPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const plan = user?.subscription?.plan ?? 'FREE';
    const hasAI = plan === 'PRO' || plan === 'BUSINESS';

    // ── Document / pages ────────────────────────────────────────────────────
    const [document, setDocument] = useState<Document | null>(null);
    const [pages, setPages] = useState<PageInfo[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput, setPageInput] = useState('1');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);

    // ── Editor ───────────────────────────────────────────────────────────────
    const [editorMode, setEditorMode] = useState(false);
    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // ── Tool settings ────────────────────────────────────────────────────────
    const [toolColor, setToolColor] = useState('#000000');
    const [toolFill, setToolFill] = useState('transparent');
    const [toolFontSize, setToolFontSize] = useState(14);
    const [toolLineWidth, setToolLineWidth] = useState(2);

    // ── Drawing ──────────────────────────────────────────────────────────────
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
    const [liveEl, setLiveEl] = useState<CanvasElement | null>(null);

    // ── Drag / resize ────────────────────────────────────────────────────────
    const [isDragging, setIsDragging] = useState(false);
    const [dragOff, setDragOff] = useState({ x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [rHandle, setRHandle] = useState<ResizeHandle | null>(null);
    const [rStart, setRStart] = useState({ mx: 0, my: 0, ex: 0, ey: 0, ew: 0, eh: 0 });

    // ── Text editing ─────────────────────────────────────────────────────────
    const [editingId, setEditingId] = useState<string | null>(null);
    const [textDraft, setTextDraft] = useState('');

    // ── Signatures ───────────────────────────────────────────────────────────
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [showSigPanel, setShowSigPanel] = useState(false);
    const [pendingSig, setPendingSig] = useState<Signature | null>(null);

    // ── Image ────────────────────────────────────────────────────────────────
    const [pendingImg, setPendingImg] = useState<File | null>(null);
    const imgInputRef = useRef<HTMLInputElement>(null);

    // ── Version History Panel ──────────────────────────────────────────────
    const [showVersions, setShowVersions] = useState(false);
    const [versions, setVersions] = useState<import('../types').DocumentVersion[]>([]);
    const [versionsLoading, setVersionsLoading] = useState(false);
    const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

    // ── AI Panel ─────────────────────────────────────────────────────────────
    const [showAI, setShowAI] = useState(false);
    const [aiLoading, setAiLoading] = useState<string | null>(null); // which feature is loading
    const [aiError, setAiError] = useState<string | null>(null);

    // Classify
    const [classifyResult, setClassifyResult] = useState<any>(null);
    // Summarize
    const [summaryResult, setSummaryResult] = useState<any>(null);
    const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    // Executive summary
    const [execSummary, setExecSummary] = useState<string | null>(null);
    // Action items
    const [actionItems, setActionItems] = useState<string[]>([]);
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
    // Q&A
    const [qaResult, setQaResult] = useState<{ question: string; answer: string }[]>([]);
    const [qaCount, setQaCount] = useState(5);
    const [openQA, setOpenQA] = useState<number | null>(null);
    // Extract data
    const [extractResult, setExtractResult] = useState<any>(null);
    const [extractType, setExtractType] = useState<'auto' | 'invoice' | 'receipt' | 'form' | 'contract'>('auto');
    // Translate
    const [translateResult, setTranslateResult] = useState<any>(null);
    const [languages, setLanguages] = useState<string[]>([]);
    const [selectedLang, setSelectedLang] = useState('Spanish');
    // Active AI tab
    const [aiTab, setAiTab] = useState<'classify' | 'summary' | 'actions' | 'qa' | 'extract' | 'translate'>('summary');

    const overlayRef = useRef<HTMLDivElement>(null);

    // ── Derived ──────────────────────────────────────────────────────────────
    const pageInfo: PageInfo = pages.find(p => p.pageNumber === currentPage) ?? { pageNumber: 1, width: 595, height: 842 };
    const scale = VIEWER_WIDTH / pageInfo.width;
    const viewerH = Math.round(pageInfo.height * scale);
    const totalPages = document?.pageCount || pages.length || 1;

    /**
     * Convert overlay CSS-px coordinates to PDF points.
     *  - PDF origin is BOTTOM-LEFT; CSS origin is TOP-LEFT.
     *  - y = 0 in CSS  →  y = pageHeight in PDF (top of page).
     */
    const toPDF = useCallback(
        (cssX: number, cssY: number) => ({
            x: Math.round(cssX / scale),
            y: Math.round((viewerH - cssY) / scale),
        }),
        [scale, viewerH],
    );

    // ── Data fetching ────────────────────────────────────────────────────────

    const loadDocument = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [docRes, pagesRes] = await Promise.all([
                documentAPI.getById(id),
                documentAPI.getPages(id),
            ]);
            const doc = docRes.data?.data ?? docRes.data;
            setDocument(doc);
            const pagesArr: PageInfo[] =
                pagesRes.data?.data?.pages ??
                pagesRes.data?.pages ??
                [];
            if (pagesArr.length > 0) setPages(pagesArr);
        } catch (err) {
            console.error('loadDocument error:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadVersions = useCallback(async () => {
        if (!id) return;
        try {
            setVersionsLoading(true);
            const res = await documentAPI.getVersions(id);
            const raw = res.data?.data ?? res.data?.versions ?? res.data ?? [];
            setVersions(Array.isArray(raw) ? raw : []);
        } catch (err) {
            console.error('loadVersions error:', err);
        } finally {
            setVersionsLoading(false);
        }
    }, [id]);

    const handleRestoreVersion = useCallback(async (versionNumber: number) => {
        if (!id) return;
        if (!window.confirm(`Restore version ${versionNumber}? The current document will be replaced.`)) return;
        try {
            setRestoringVersion(versionNumber);
            await documentAPI.restoreVersion(id, versionNumber);
            await loadDocument();
            await loadVersions();
            setShowVersions(false);
        } catch (err) {
            console.error('restoreVersion error:', err);
            alert('Failed to restore version. Please try again.');
        } finally {
            setRestoringVersion(null);
        }
    }, [id, loadDocument, loadVersions]);

    const loadSignatures = useCallback(async () => {
        try {
            const res = await documentAPI.listSignatures();
            const raw = res.data?.data ?? res.data?.signatures ?? res.data ?? [];
            setSignatures(Array.isArray(raw) ? raw : []);
        } catch (err) {
            console.error('loadSignatures error:', err);
        }
    }, []);

    useEffect(() => {
        loadDocument();
        loadSignatures();
    }, [loadDocument, loadSignatures]);

    // Keep the page-number input in sync when page changes via prev/next or thumbnail
    useEffect(() => {
        setPageInput(String(currentPage));
    }, [currentPage]);

    // Changing the page must force the iframe to reload with the new #page fragment
    useEffect(() => {
        setIframeKey(k => k + 1);
    }, [currentPage]);

    // ── Keyboard shortcuts ───────────────────────────────────────────────────

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

            if (!inInput) {
                if (e.key === 'v') setActiveTool('select');
                if (e.key === 't') setActiveTool('text');
                if (e.key === 'r') setActiveTool('rectangle');
                if (e.key === 'c') setActiveTool('circle');
                if (e.key === 'l') setActiveTool('line');
                if (e.key === 'i') { setActiveTool('image'); imgInputRef.current?.click(); }
                if (e.key === 's') { setActiveTool('signature'); setShowSigPanel(true); }
                if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) deleteSelected();
                if (e.key === 'Escape') {
                    finishTextEdit();
                    setActiveTool('select');
                    setPendingImg(null);
                    setPendingSig(null);
                    setShowSigPanel(false);
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                setEditorMode(m => !m);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    // ── Overlay geometry ─────────────────────────────────────────────────────

    const overlayCoords = (e: React.MouseEvent) => {
        const rect = overlayRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    // ── Mouse handlers ───────────────────────────────────────────────────────

    const onOverlayDown = (e: React.MouseEvent) => {
        if (!editorMode || e.button !== 0) return;
        const pos = overlayCoords(e);

        // Deselect if clicking blank area with select tool
        if (activeTool === 'select') {
            finishTextEdit();
            setSelectedId(null);
            return;
        }

        if (activeTool === 'text') {
            const el = makeEl('text', pos.x, pos.y, 200, toolFontSize * 1.6);
            setElements(prev => [...prev, el]);
            setSelectedId(el.id);
            setEditingId(el.id);
            setTextDraft('');
            return;
        }

        if (activeTool === 'image') {
            if (pendingImg) placeImage(pos.x, pos.y);
            else imgInputRef.current?.click();
            return;
        }

        if (activeTool === 'signature') {
            if (pendingSig) placeSig(pos.x, pos.y);
            else setShowSigPanel(true);
            return;
        }

        // Drawing tools
        e.preventDefault();
        setIsDrawing(true);
        setDrawStart(pos);
        const el = makeEl(activeTool as CanvasElement['type'], pos.x, pos.y, 0, 0);
        setLiveEl(el);
    };

    const onOverlayMove = (e: React.MouseEvent) => {
        if (!editorMode) return;

        if (isDrawing && liveEl) {
            const pos = overlayCoords(e);
            if (liveEl.type === 'line' || liveEl.type === 'arrow') {
                setLiveEl(prev => prev ? { ...prev, width: pos.x - drawStart.x, height: pos.y - drawStart.y } : null);
            } else {
                const x = Math.min(pos.x, drawStart.x);
                const y = Math.min(pos.y, drawStart.y);
                setLiveEl(prev => prev ? { ...prev, x, y, width: Math.abs(pos.x - drawStart.x), height: Math.abs(pos.y - drawStart.y) } : null);
            }
            return;
        }

        if (isDragging && selectedId) {
            const pos = overlayCoords(e);
            setElements(prev => prev.map(el =>
                el.id === selectedId
                    ? { ...el, x: Math.max(0, pos.x - dragOff.x), y: Math.max(0, pos.y - dragOff.y) }
                    : el,
            ));
            return;
        }

        if (isResizing && selectedId && rHandle) {
            const pos = overlayCoords(e);
            const dx = pos.x - rStart.mx, dy = pos.y - rStart.my;
            setElements(prev => prev.map(el => {
                if (el.id !== selectedId) return el;
                let nx = rStart.ex, ny = rStart.ey, nw = rStart.ew, nh = rStart.eh;
                const MIN_W = 20, MIN_H = 10;
                if (rHandle.includes('e')) nw = Math.max(MIN_W, rStart.ew + dx);
                if (rHandle.includes('w')) { nx = rStart.ex + dx; nw = Math.max(MIN_W, rStart.ew - dx); }
                if (rHandle.includes('s')) nh = Math.max(MIN_H, rStart.eh + dy);
                if (rHandle.includes('n')) { ny = rStart.ey + dy; nh = Math.max(MIN_H, rStart.eh - dy); }
                return { ...el, x: nx, y: ny, width: nw, height: nh };
            }));
        }
    };

    const onOverlayUp = () => {
        if (isDrawing && liveEl) {
            setIsDrawing(false);
            const el = { ...liveEl };
            const isLinear = el.type === 'line' || el.type === 'arrow';
            if (!isLinear && el.width < 5 && el.height < 5) {
                el.width = 100; el.height = 60;
            }
            setElements(prev => [...prev, el]);
            setSelectedId(el.id);
            setLiveEl(null);
            setActiveTool('select');
            return;
        }
        setIsDragging(false);
        setIsResizing(false);
    };

    // Mouse leave: cancel any in-progress draw/drag without committing
    const onOverlayLeave = () => {
        if (isDrawing) {
            setIsDrawing(false);
            setLiveEl(null);
            return;
        }
        setIsDragging(false);
        setIsResizing(false);
    };

    const onElementDown = (e: React.MouseEvent, elId: string) => {
        if (!editorMode) return;
        e.stopPropagation();
        if (editingId && editingId !== elId) finishTextEdit();
        if (activeTool !== 'select') return;
        setSelectedId(elId);
        const pos = overlayCoords(e);
        const el = elements.find(x => x.id === elId)!;
        setDragOff({ x: pos.x - el.x, y: pos.y - el.y });
        setIsDragging(true);
    };

    const onResizeDown = (e: React.MouseEvent, elId: string, handle: ResizeHandle) => {
        e.stopPropagation();
        e.preventDefault();
        const el = elements.find(x => x.id === elId)!;
        const pos = overlayCoords(e);
        setRStart({ mx: pos.x, my: pos.y, ex: el.x, ey: el.y, ew: el.width, eh: el.height });
        setRHandle(handle);
        setIsResizing(true);
        setSelectedId(elId);
    };

    // ── Text helpers ─────────────────────────────────────────────────────────

    const finishTextEdit = () => {
        if (!editingId) return;
        setElements(prev => prev.map(el =>
            el.id === editingId
                ? { ...el, text: textDraft, width: Math.max(80, textDraft.length * ((el.fontSize ?? 14) * 0.55)), height: (el.fontSize ?? 14) * 1.8 }
                : el,
        ));
        setEditingId(null);
    };

    // ── Element factory ──────────────────────────────────────────────────────

    const makeEl = (type: CanvasElement['type'], x: number, y: number, w: number, h: number): CanvasElement => ({
        id: uid(),
        type,
        x, y, width: w, height: h,
        color: toolColor,
        fillColor: toolFill,
        lineWidth: toolLineWidth,
        fontSize: toolFontSize,
        committed: false,
    });

    // ── Place image / signature ───────────────────────────────────────────────

    const placeImage = (cx: number, cy: number) => {
        if (!pendingImg) return;
        const url = URL.createObjectURL(pendingImg);
        const el: CanvasElement = { ...makeEl('image', cx - 60, cy - 40, 120, 80), imageFile: pendingImg, imagePreviewUrl: url };
        setElements(prev => [...prev, el]);
        setSelectedId(el.id);
        setPendingImg(null);
        setActiveTool('select');
    };

    const placeSig = (cx: number, cy: number) => {
        if (!pendingSig) return;
        const el: CanvasElement = { ...makeEl('signature', cx - 60, cy - 30, 120, 60), signatureId: pendingSig.id, signatureUrl: pendingSig.storageUrl };
        setElements(prev => [...prev, el]);
        setSelectedId(el.id);
        setPendingSig(null);
        setActiveTool('select');
    };

    // ── Delete ───────────────────────────────────────────────────────────────

    const deleteSelected = () => {
        if (!selectedId) return;
        setElements(prev => prev.filter(el => el.id !== selectedId));
        setSelectedId(null);
        if (editingId === selectedId) setEditingId(null);
    };

    // ── Apply selected element to PDF ────────────────────────────────────────

    const commitElement = async (el: CanvasElement) => {
        if (!id) return;

        // Flush any in-progress text edit so we use the live draft, not stale el.text
        let resolvedText = el.text;
        if (el.type === 'text' && editingId === el.id) {
            resolvedText = textDraft;
            setElements(prev => prev.map(e =>
                e.id === el.id ? { ...e, text: textDraft } : e,
            ));
            setEditingId(null);
        }

        // Guard empty text BEFORE setSaving to avoid a stuck loading state
        if (el.type === 'text' && !resolvedText?.trim()) {
            alert('Please type some text before applying.');
            return;
        }

        setSaving(true);
        try {
            if (el.type === 'text') {
                const pd = toPDF(el.x, el.y + (el.height ?? 0));
                await documentAPI.addText(id, {
                    pageNumber: currentPage,
                    x: pd.x,
                    y: pd.y,
                    text: resolvedText!,
                    fontSize: el.fontSize ?? 14,
                    color: el.color,
                });
            } else if (el.type === 'rectangle' || el.type === 'circle') {
                const pd = toPDF(el.x, el.y + el.height);
                await documentAPI.drawShape(id, {
                    pageNumber: currentPage,
                    shape: el.type,
                    x: Math.round(el.x / scale),
                    y: pd.y,
                    width: Math.round(el.width / scale),
                    height: Math.round(el.height / scale),
                    color: el.color,
                    fillColor: el.fillColor !== 'transparent' ? el.fillColor : undefined,
                    lineWidth: el.lineWidth,
                });
            } else if (el.type === 'line' || el.type === 'arrow') {
                const pd = toPDF(el.x, el.y);
                await documentAPI.drawShape(id, {
                    pageNumber: currentPage,
                    shape: 'line',
                    x: pd.x,
                    y: pd.y,
                    width: Math.round(el.width / scale),
                    height: Math.round(-el.height / scale), // line dy; negate for PDF y flip
                    color: el.color,
                    lineWidth: el.lineWidth,
                });
            } else if (el.type === 'image' && el.imageFile) {
                const base64 = await fileToBase64(el.imageFile);
                const pd = toPDF(el.x, el.y + el.height);
                await documentAPI.addImage(id, {
                    pageNumber: currentPage,
                    imageBase64: base64,
                    mimeType: el.imageFile.type as 'image/png' | 'image/jpeg',
                    x: Math.round(el.x / scale),
                    y: pd.y,
                    width: Math.round(el.width / scale),
                    height: Math.round(el.height / scale),
                });
            } else if (el.type === 'signature' && el.signatureId) {
                const pd = toPDF(el.x, el.y + el.height);
                await documentAPI.applySignature(id, {
                    signatureId: el.signatureId,
                    pageNumber: currentPage,
                    x: Math.round(el.x / scale),
                    y: pd.y,
                    width: Math.round(el.width / scale),
                    height: Math.round(el.height / scale),
                });
            }
            setElements(prev => prev.map(e => e.id === el.id ? { ...e, committed: true } : e));
            await loadDocument();
            setIframeKey(k => k + 1);
        } catch (err: any) {
            alert(err.response?.data?.error ?? 'Failed to apply. Check the console.');
            console.error('commitElement error:', err);
        } finally {
            setSaving(false);
        }
    };

    const commitAll = async () => {
        for (const el of elements.filter(e => !e.committed)) {
            await commitElement(el);
        }
    };

    // ── File helper ───────────────────────────────────────────────────────────

    const fileToBase64 = (file: File): Promise<string> =>
        new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = e => res((e.target!.result as string).split(',')[1]);
            r.onerror = rej;
            r.readAsDataURL(file);
        });

    // ── AI handlers ───────────────────────────────────────────────────────────

    const runAI = async <T,>(feature: string, fn: () => Promise<T>, setter: (v: T) => void) => {
        setAiLoading(feature);
        setAiError(null);
        try {
            const result = await fn();
            setter(result);
        } catch (err: any) {
            setAiError(err.response?.data?.error ?? `${feature} failed`);
        } finally {
            setAiLoading(null);
        }
    };

    const handleClassify = () =>
        runAI('classify', async () => {
            const res = await documentAPI.classifyDocument(id!);
            return res.data?.data ?? res.data;
        }, setClassifyResult);

    const handleSummarize = () =>
        runAI('summarize', async () => {
            const res = await documentAPI.summarizeDocument(id!, summaryLength);
            return res.data?.data ?? res.data;
        }, setSummaryResult);

    const handleExecSummary = () =>
        runAI('exec', async () => {
            const res = await documentAPI.executiveSummary(id!);
            return (res.data?.data?.summary ?? res.data?.summary ?? '') as string;
        }, setExecSummary);

    const handleActionItems = () =>
        runAI('actions', async () => {
            const res = await documentAPI.extractActionItems(id!);
            const items = res.data?.data?.actionItems ?? res.data?.actionItems ?? [];
            return items as string[];
        }, (v) => { setActionItems(v); setCheckedItems({}); });

    const handleQA = () =>
        runAI('qa', async () => {
            const res = await documentAPI.generateQAPairs(id!, qaCount);
            return (res.data?.data?.qaPairs ?? res.data?.qaPairs ?? []) as { question: string; answer: string }[];
        }, setQaResult);

    const handleExtract = () =>
        runAI('extract', async () => {
            const res = await documentAPI.extractDocumentData(id!, extractType);
            return res.data?.data ?? res.data;
        }, setExtractResult);

    const handleTranslate = () =>
        runAI('translate', async () => {
            const res = await documentAPI.translateDocument(id!, selectedLang);
            return res.data?.data ?? res.data;
        }, setTranslateResult);

    const loadLanguages = useCallback(async () => {
        try {
            const res = await aiAPI.getSupportedLanguages();
            const langs = (res as any)?.languages ?? [];
            if (Array.isArray(langs)) setLanguages(langs);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { if (showAI) loadLanguages(); }, [showAI, loadLanguages]);
    useEffect(() => { if (showVersions) loadVersions(); }, [showVersions, loadVersions]);

    const copyText = (text: string) => navigator.clipboard.writeText(text).catch(() => {});

    const toggleSection = (key: string) =>
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

    // ── Download ─────────────────────────────────────────────────────────────

    const handleDownload = async () => {
        if (!id || !document) return;
        try {
            const res = await documentAPI.download(id);
            // Response shape: { success, data: { downloadUrl, filename, expiresIn } }
            // Axios wraps the body in res.data, so the URL is at res.data.data.downloadUrl.
            // Fetch fresh on every click — signed URL is valid for 15 min, never cache.
            const downloadUrl: string | undefined = res.data?.data?.downloadUrl;
            if (!downloadUrl) throw new Error('Server did not return a download URL');

            // Signed GCS URL includes Content-Disposition: attachment, so the browser
            // downloads the file natively. <a> click is used over window.open() to avoid
            // popup blockers.
            const a = window.document.createElement('a');
            a.href = downloadUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            window.document.body.appendChild(a);
            a.click();
            window.document.body.removeChild(a);
        } catch (err: any) {
            console.error('Download failed:', err);
            alert(`Download failed: ${err?.message ?? 'Unknown error'}`);
        }
    };

    // ── Render helpers ────────────────────────────────────────────────────────

    const handles: { pos: ResizeHandle; cursor: string; style: React.CSSProperties }[] = [
        { pos: 'nw', cursor: 'nw-resize', style: { top: -HANDLE_PX / 2, left: -HANDLE_PX / 2 } },
        { pos: 'n', cursor: 'n-resize', style: { top: -HANDLE_PX / 2, left: '50%', transform: 'translateX(-50%)' } },
        { pos: 'ne', cursor: 'ne-resize', style: { top: -HANDLE_PX / 2, right: -HANDLE_PX / 2 } },
        { pos: 'e', cursor: 'e-resize', style: { top: '50%', right: -HANDLE_PX / 2, transform: 'translateY(-50%)' } },
        { pos: 'se', cursor: 'se-resize', style: { bottom: -HANDLE_PX / 2, right: -HANDLE_PX / 2 } },
        { pos: 's', cursor: 's-resize', style: { bottom: -HANDLE_PX / 2, left: '50%', transform: 'translateX(-50%)' } },
        { pos: 'sw', cursor: 'sw-resize', style: { bottom: -HANDLE_PX / 2, left: -HANDLE_PX / 2 } },
        { pos: 'w', cursor: 'w-resize', style: { left: -HANDLE_PX / 2, top: '50%', transform: 'translateY(-50%)' } },
    ];

    const renderHandles = (elId: string) =>
        handles.map(h => (
            <div
                key={h.pos}
                onMouseDown={e => onResizeDown(e, elId, h.pos)}
                style={{
                    ...h.style,
                    position: 'absolute',
                    width: HANDLE_PX,
                    height: HANDLE_PX,
                    cursor: h.cursor,
                    backgroundColor: '#fff',
                    border: '2px solid #3b82f6',
                    borderRadius: 2,
                    zIndex: 25,
                }}
            />
        ));

    const renderEl = (el: CanvasElement, live = false) => {
        const isSelected = !live && selectedId === el.id;
        const isEditing = editingId === el.id;
        const outlineStyle = isSelected
            ? '2px solid #3b82f6'
            : live
                ? '2px dashed #93c5fd'
                : 'none';

        const base: React.CSSProperties = {
            position: 'absolute',
            left: el.x, top: el.y,
            zIndex: isSelected ? 15 : 10,
            cursor: !live && activeTool === 'select' ? 'move' : 'crosshair',
            userSelect: 'none',
            outline: outlineStyle,
            outlineOffset: '1px',
        };

        // ── Text ────────────────────────────────────────────────────────────
        if (el.type === 'text') {
            return (
                <div
                    key={el.id}
                    style={{ ...base, padding: '2px 4px', minWidth: 60, minHeight: 20, background: 'rgba(255,255,255,0.8)', borderRadius: 3 }}
                    onMouseDown={e => onElementDown(e, el.id)}
                    onDoubleClick={() => { setEditingId(el.id); setTextDraft(el.text ?? ''); setSelectedId(el.id); }}
                >
                    {isEditing
                        ? (
                            <textarea
                                autoFocus
                                value={textDraft}
                                onChange={e => setTextDraft(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishTextEdit(); }
                                    if (e.key === 'Escape') finishTextEdit();
                                }}
                                rows={1}
                                style={{ fontSize: el.fontSize, color: el.color, fontFamily: 'sans-serif', background: 'transparent', border: 'none', outline: 'none', resize: 'none', width: Math.max(150, el.width), lineHeight: 1.5 }}
                            />
                        )
                        : (
                            <span style={{ fontSize: el.fontSize, color: el.color, fontFamily: 'sans-serif', whiteSpace: 'pre-wrap' }}>
                                {el.text || <i style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>Click to type…</i>}
                            </span>
                        )}
                    {isSelected && renderHandles(el.id)}
                    {el.committed && <span style={{ position: 'absolute', top: -18, right: 0, background: '#22c55e', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>✓ saved</span>}
                </div>
            );
        }

        // ── Rectangle ───────────────────────────────────────────────────────
        if (el.type === 'rectangle') {
            return (
                <div
                    key={el.id}
                    style={{
                        ...base,
                        width: el.width,
                        height: el.height,
                        border: `${el.lineWidth}px solid ${el.color}`,
                        backgroundColor: el.fillColor === 'transparent' ? 'rgba(255,255,255,0.01)' : el.fillColor,
                    }}
                    onMouseDown={e => onElementDown(e, el.id)}
                >
                    {isSelected && renderHandles(el.id)}
                    {el.committed && <span style={{ position: 'absolute', top: -18, right: 0, background: '#22c55e', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>✓</span>}
                </div>
            );
        }

        // ── Circle ──────────────────────────────────────────────────────────
        if (el.type === 'circle') {
            return (
                <div
                    key={el.id}
                    style={{
                        ...base,
                        width: el.width,
                        height: el.height,
                        border: `${el.lineWidth}px solid ${el.color}`,
                        backgroundColor: el.fillColor === 'transparent' ? 'rgba(255,255,255,0.01)' : el.fillColor,
                        borderRadius: '50%',
                    }}
                    onMouseDown={e => onElementDown(e, el.id)}
                >
                    {isSelected && renderHandles(el.id)}
                    {el.committed && <span style={{ position: 'absolute', top: -18, right: 0, background: '#22c55e', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>✓</span>}
                </div>
            );
        }

        // ── Line / Arrow ────────────────────────────────────────────────────
        if (el.type === 'line' || el.type === 'arrow') {
            const len = Math.sqrt(el.width * el.width + el.height * el.height);
            const angle = Math.atan2(el.height, el.width) * (180 / Math.PI);
            return (
                <div
                    key={el.id}
                    style={{
                        ...base,
                        width: len,
                        height: Math.max(el.lineWidth + 4, 8),
                        transformOrigin: '0 50%',
                        transform: `rotate(${angle}deg)`,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    onMouseDown={e => onElementDown(e, el.id)}
                >
                    <div style={{ flex: 1, height: el.lineWidth, backgroundColor: el.color }} />
                    {el.type === 'arrow' && <div style={{ width: 0, height: 0, borderTop: `${el.lineWidth + 4}px solid transparent`, borderBottom: `${el.lineWidth + 4}px solid transparent`, borderLeft: `${el.lineWidth + 8}px solid ${el.color}` }} />}
                    {isSelected && <div style={{ position: 'absolute', inset: -4, border: '2px dashed #3b82f6', pointerEvents: 'none' }} />}
                </div>
            );
        }

        // ── Image ───────────────────────────────────────────────────────────
        if (el.type === 'image') {
            return (
                <div
                    key={el.id}
                    style={{ ...base, width: el.width, height: el.height }}
                    onMouseDown={e => onElementDown(e, el.id)}
                >
                    {el.imagePreviewUrl && <img src={el.imagePreviewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />}
                    {isSelected && renderHandles(el.id)}
                    {el.committed && <span style={{ position: 'absolute', top: -18, right: 0, background: '#22c55e', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>✓</span>}
                </div>
            );
        }

        // ── Signature ───────────────────────────────────────────────────────
        if (el.type === 'signature') {
            return (
                <div
                    key={el.id}
                    style={{ ...base, width: el.width, height: el.height }}
                    onMouseDown={e => onElementDown(e, el.id)}
                >
                    {el.signatureUrl && <img src={el.signatureUrl} alt="sig" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />}
                    {isSelected && renderHandles(el.id)}
                    {el.committed && <span style={{ position: 'absolute', top: -18, right: 0, background: '#22c55e', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 3 }}>✓ signed</span>}
                </div>
            );
        }

        return null;
    };

    // ── Derived summary ───────────────────────────────────────────────────────

    const pendingCount = elements.filter(e => !e.committed).length;
    const selectedEl = elements.find(e => e.id === selectedId) ?? null;

    // ── Loading / not found ───────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-500">Loading document…</p>
                </div>
            </div>
        );
    }

    if (!document) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <p className="text-xl font-semibold text-slate-700">Document not found</p>
                    <button onClick={() => navigate('/documents')} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
                        Back to Documents
                    </button>
                </div>
            </div>
        );
    }

    // ── Main UI ───────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-screen bg-slate-100 overflow-hidden select-none">

            {/* ████ TOP BAR ████ */}
            <header className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-white border-b border-slate-200 shadow-sm z-30">
                <button onClick={() => navigate('/documents')} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>

                <div className="flex-1 min-w-0">
                    <h1 className="text-base font-semibold text-slate-800 truncate">{document.title}</h1>
                    <p className="text-xs text-slate-400">{document.type} · {totalPages} {totalPages === 1 ? 'page' : 'pages'}</p>
                </div>

                {/* Page nav */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="p-1 rounded hover:bg-white disabled:opacity-40 transition">
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={pageInput}
                        onChange={e => setPageInput(e.target.value)}
                        onBlur={() => {
                            const n = parseInt(pageInput);
                            if (!isNaN(n)) setCurrentPage(Math.max(1, Math.min(totalPages, n)));
                            else setPageInput(String(currentPage));
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                const n = parseInt(pageInput);
                                if (!isNaN(n)) setCurrentPage(Math.max(1, Math.min(totalPages, n)));
                                else setPageInput(String(currentPage));
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                        className="w-10 text-center text-sm font-medium text-slate-700 bg-transparent border-none outline-none tabular-nums [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-sm text-slate-400 select-none">/ {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1 rounded hover:bg-white disabled:opacity-40 transition">
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                </div>

                <button
                    onClick={() => { setEditorMode(m => { if (m) { setElements([]); setSelectedId(null); } return !m; }); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm ${editorMode ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                    <Edit3 className="w-4 h-4" />
                    {editorMode ? 'Exit Editor' : 'Edit PDF'}
                </button>

                <button
                    onClick={() => hasAI ? setShowAI(m => !m) : undefined}
                    title={hasAI ? 'AI Tools' : 'Upgrade to PRO or BUSINESS to unlock AI features'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                        !hasAI
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                            : showAI
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                    <Sparkles className="w-4 h-4" />
                    AI Tools
                    {!hasAI && <span className="text-xs bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full font-semibold ml-1">PRO</span>}
                </button>

                <button
                    onClick={() => { setShowVersions(v => !v); if (showAI) setShowAI(false); }}
                    title="Version History"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                        showVersions
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                >
                    <History className="w-4 h-4" />
                    History
                </button>

                <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-sm transition-colors">
                    <Download className="w-4 h-4" />
                    Download
                </button>
            </header>

            {/* ████ EDITOR TOOLBAR ████ */}
            {editorMode && (
                <div className="flex-shrink-0 flex items-center flex-wrap gap-1.5 px-4 py-2 bg-white border-b border-slate-200 z-20">
                    {/* Tool buttons */}
                    {(
                        [
                            { t: 'select' as ToolType, icon: <MousePointer className="w-4 h-4" />, tip: 'Select · V' },
                            { t: 'text' as ToolType, icon: <Type className="w-4 h-4" />, tip: 'Text · T' },
                            { t: 'rectangle' as ToolType, icon: <Square className="w-4 h-4" />, tip: 'Rectangle · R' },
                            { t: 'circle' as ToolType, icon: <Circle className="w-4 h-4" />, tip: 'Circle · C' },
                            { t: 'line' as ToolType, icon: <Minus className="w-4 h-4" />, tip: 'Line · L' },
                            { t: 'arrow' as ToolType, icon: <ArrowRight className="w-4 h-4" />, tip: 'Arrow' },
                            { t: 'image' as ToolType, icon: <ImageIcon className="w-4 h-4" />, tip: 'Image · I' },
                            { t: 'signature' as ToolType, icon: <PenTool className="w-4 h-4" />, tip: 'Signature · S' },
                        ] as { t: ToolType; icon: JSX.Element; tip: string }[]
                    ).map(({ t, icon, tip }) => (
                        <button
                            key={t}
                            title={tip}
                            onClick={() => {
                                setActiveTool(t);
                                if (t === 'signature') setShowSigPanel(true);
                                if (t === 'image') imgInputRef.current?.click();
                            }}
                            className={`p-2 rounded-lg text-sm transition-all ${activeTool === t ? 'bg-blue-600 text-white shadow shadow-blue-500/30' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            {icon}
                        </button>
                    ))}

                    <div className="w-px h-6 bg-slate-200 mx-0.5" />

                    {/* Stroke color */}
                    <label title="Stroke / text color" className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                        <Palette className="w-3.5 h-3.5" />
                        <input
                            type="color"
                            value={toolColor}
                            onChange={e => {
                                setToolColor(e.target.value);
                                if (selectedId) setElements(prev => prev.map(el => el.id === selectedId ? { ...el, color: e.target.value } : el));
                            }}
                            className="w-7 h-6 rounded cursor-pointer p-0 border-0"
                        />
                    </label>

                    {/* Fill color */}
                    <label title="Fill color" className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                        <span>Fill</span>
                        <input
                            type="color"
                            value={toolFill === 'transparent' ? '#ffffff' : toolFill}
                            onChange={e => {
                                setToolFill(e.target.value);
                                if (selectedId) setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fillColor: e.target.value } : el));
                            }}
                            className="w-7 h-6 rounded cursor-pointer p-0 border-0"
                        />
                        <button
                            title="No fill"
                            onClick={() => { setToolFill('transparent'); if (selectedId) setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fillColor: 'transparent' } : el)); }}
                            className="text-xs px-1 bg-slate-100 rounded hover:bg-slate-200"
                        >∅</button>
                    </label>

                    {/* Font size */}
                    <label title="Font size" className="flex items-center gap-1 text-xs text-slate-600">
                        <AlignLeft className="w-3.5 h-3.5" />
                        <input
                            type="number"
                            value={toolFontSize}
                            min={6} max={96}
                            onChange={e => {
                                const v = parseInt(e.target.value) || 14;
                                setToolFontSize(v);
                                if (selectedId) setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontSize: v } : el));
                            }}
                            className="w-12 text-xs border border-slate-200 rounded px-1 py-0.5 text-center"
                        />
                        <span>pt</span>
                    </label>

                    {/* Line width */}
                    <label title="Line width" className="flex items-center gap-1 text-xs text-slate-600">
                        <Minus className="w-3.5 h-3.5" />
                        <input
                            type="range" min={1} max={12}
                            value={toolLineWidth}
                            onChange={e => {
                                const v = parseInt(e.target.value);
                                setToolLineWidth(v);
                                if (selectedId) setElements(prev => prev.map(el => el.id === selectedId ? { ...el, lineWidth: v } : el));
                            }}
                            className="w-16"
                        />
                        <span className="w-4 text-center">{toolLineWidth}</span>
                    </label>

                    <div className="w-px h-6 bg-slate-200 mx-0.5" />

                    {/* Delete */}
                    {selectedId && (
                        <button title="Delete selected (Del)" onClick={deleteSelected} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}

                    {/* Apply selected */}
                    {selectedEl && !selectedEl.committed && (
                        <button
                            onClick={() => commitElement(selectedEl)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Apply to PDF
                        </button>
                    )}

                    {/* Apply all */}
                    {pendingCount > 1 && (
                        <button
                            onClick={commitAll}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                            Apply All ({pendingCount})
                        </button>
                    )}

                    {/* Clear canvas */}
                    {elements.length > 0 && (
                        <button onClick={() => { setElements([]); setSelectedId(null); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg text-xs transition-colors" title="Clear all elements">
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Status pills */}
                    {pendingImg && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-medium">
                            📎 {pendingImg.name} — click on PDF to place
                        </span>
                    )}
                    {pendingSig && (
                        <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-medium">
                            ✒ {pendingSig.name} — click on PDF to place
                        </span>
                    )}
                </div>
            )}

            {/* Hidden file input */}
            <input ref={imgInputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setPendingImg(f); setActiveTool('image'); } e.target.value = ''; }} />

            {/* ████ MAIN AREA ████ */}
            <div className="flex flex-1 overflow-hidden">

                {/* Page thumbnail strip */}
                {totalPages > 1 && (
                    <aside className="flex-shrink-0 w-20 bg-white border-r border-slate-200 overflow-y-auto py-3 px-2 space-y-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setCurrentPage(p)}
                                className={`w-full aspect-[3/4] flex items-center justify-center text-xs font-bold rounded-md border-2 transition-all ${p === currentPage ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </aside>
                )}

                {/* Viewer + overlay */}
                <main className="flex-1 overflow-auto bg-slate-300 flex flex-col items-center py-8 gap-4">
                    {/* Page container */}
                    <div
                        className="relative bg-white shadow-2xl"
                        style={{ width: VIEWER_WIDTH, height: viewerH, flexShrink: 0 }}
                    >
                        {/* PDF iframe */}
                        <iframe
                            key={iframeKey}
                            src={document.storageUrl ? `${document.storageUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0` : ''}
                            title={document.title}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                pointerEvents: editorMode ? 'none' : 'auto',
                            }}
                        />

                        {/* Edit overlay */}
                        {editorMode && (
                            <div
                                ref={overlayRef}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    zIndex: 5,
                                    cursor:
                                        activeTool === 'select' ? 'default'
                                        : activeTool === 'text' ? 'text'
                                        : 'crosshair',
                                }}
                                onMouseDown={onOverlayDown}
                                onMouseMove={onOverlayMove}
                                onMouseUp={onOverlayUp}
                                onMouseLeave={onOverlayLeave}
                            >
                                {/* Empty state hint */}
                                {elements.length === 0 && !isDrawing && (
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                        <div style={{ textAlign: 'center', opacity: 0.35 }}>
                                            <div style={{ fontSize: 40, marginBottom: 8 }}>
                                                {activeTool === 'select' ? '✦'
                                                    : activeTool === 'text' ? 'T'
                                                    : activeTool === 'rectangle' ? '▭'
                                                    : activeTool === 'circle' ? '◯'
                                                    : activeTool === 'line' ? '—'
                                                    : activeTool === 'arrow' ? '→'
                                                    : activeTool === 'image' ? '🖼'
                                                    : '✒'}
                                            </div>
                                            <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                                {activeTool === 'select' && 'Pick a tool from the toolbar'}
                                                {activeTool === 'text' && 'Click anywhere to place text'}
                                                {(activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'arrow') && 'Click and drag to draw'}
                                                {activeTool === 'image' && 'Choose an image, then click to place'}
                                                {activeTool === 'signature' && 'Choose a signature from the panel'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Render all elements */}
                                {elements.map(el => renderEl(el))}

                                {/* Live drawing preview */}
                                {liveEl && renderEl(liveEl, true)}
                            </div>
                        )}

                        {/* Active editor indicator */}
                        {editorMode && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', zIndex: 30, pointerEvents: 'none' }} />}
                    </div>

                    {/* Coordinates / scale info */}
                    <p style={{ fontSize: 11, color: '#94a3b8', userSelect: 'none' }}>
                        Page {currentPage} — {pageInfo.width} × {pageInfo.height} pts — scale {scale.toFixed(3)}×
                        {editorMode && selectedEl && (
                            <>  |  selected: {selectedEl.type}  x={Math.round(selectedEl.x / scale)}pt  y={Math.round((viewerH - selectedEl.y - selectedEl.height) / scale)}pt</>
                        )}
                    </p>
                </main>

                {/* ████ AI PANEL ████ */}
                {showAI && (
                    <aside className="flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden" style={{ width: 340 }}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-600" />
                                <h3 className="font-semibold text-slate-800 text-sm">AI Tools</h3>
                            </div>
                            <button onClick={() => setShowAI(false)} className="p-1 rounded-lg hover:bg-white/60 transition-colors">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        {/* Tab bar */}
                        <div className="flex flex-shrink-0 border-b border-slate-200 overflow-x-auto">
                            {([
                                { key: 'summary', icon: <FileText className="w-3.5 h-3.5" />, label: 'Summary' },
                                { key: 'classify', icon: <Tag className="w-3.5 h-3.5" />, label: 'Classify' },
                                { key: 'actions', icon: <List className="w-3.5 h-3.5" />, label: 'Actions' },
                                { key: 'qa', icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Q&A' },
                                { key: 'extract', icon: <Brain className="w-3.5 h-3.5" />, label: 'Extract' },
                                { key: 'translate', icon: <Globe className="w-3.5 h-3.5" />, label: 'Translate' },
                            ] as { key: typeof aiTab; icon: JSX.Element; label: string }[]).map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setAiTab(tab.key)}
                                    className={`flex items-center gap-1 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                                        aiTab === tab.key
                                            ? 'border-violet-600 text-violet-700 bg-violet-50'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {tab.icon}{tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Panel body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {/* Error */}
                            {aiError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                                    <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    <span>{aiError}</span>
                                </div>
                            )}

                            {/* ── SUMMARY TAB ── */}
                            {aiTab === 'summary' && (
                                <div className="space-y-3">
                                    {/* Executive summary quick banner */}
                                    {execSummary && (
                                        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed relative">
                                            <p className="font-semibold text-violet-700 mb-1 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" />Executive Summary</p>
                                            <p>{execSummary}</p>
                                            <button onClick={() => copyText(execSummary)} className="absolute top-2 right-2 p-1 hover:bg-violet-100 rounded"><Copy className="w-3 h-3 text-slate-400" /></button>
                                        </div>
                                    )}

                                    {/* Length selector + run */}
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={summaryLength}
                                            onChange={e => setSummaryLength(e.target.value as any)}
                                            className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5"
                                        >
                                            <option value="short">Short</option>
                                            <option value="medium">Medium</option>
                                            <option value="long">Long</option>
                                        </select>
                                        <button
                                            onClick={handleSummarize}
                                            disabled={!!aiLoading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 disabled:opacity-50"
                                        >
                                            {aiLoading === 'summarize' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                            Summarize
                                        </button>
                                        <button
                                            onClick={handleExecSummary}
                                            disabled={!!aiLoading}
                                            title="One-sentence executive summary"
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 disabled:opacity-50"
                                        >
                                            {aiLoading === 'exec' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
                                        </button>
                                    </div>

                                    {/* Summary result */}
                                    {summaryResult && (
                                        <div className="space-y-3">
                                            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 leading-relaxed relative">
                                                <p className="font-semibold text-slate-800 mb-1.5">Summary</p>
                                                <p>{summaryResult.summary}</p>
                                                <button onClick={() => copyText(summaryResult.summary)} className="absolute top-2 right-2 p-1 hover:bg-slate-100 rounded"><Copy className="w-3 h-3 text-slate-400" /></button>
                                            </div>

                                            {summaryResult.keyPoints?.length > 0 && (
                                                <div>
                                                    <button
                                                        onClick={() => toggleSection('keyPoints')}
                                                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 w-full mb-1.5"
                                                    >
                                                        {expandedSections['keyPoints'] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        Key Points ({summaryResult.keyPoints.length})
                                                    </button>
                                                    {expandedSections['keyPoints'] && (
                                                        <ul className="space-y-1">
                                                            {summaryResult.keyPoints.map((pt: string, i: number) => (
                                                                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                                                                    {pt}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}

                                            {summaryResult.entities && (
                                                <div>
                                                    <button
                                                        onClick={() => toggleSection('entities')}
                                                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 w-full mb-1.5"
                                                    >
                                                        {expandedSections['entities'] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                        Entities
                                                    </button>
                                                    {expandedSections['entities'] && (
                                                        <div className="space-y-1.5">
                                                            {Object.entries(summaryResult.entities).map(([key, val]) => (
                                                                Array.isArray(val) && val.length > 0 && (
                                                                    <div key={key}>
                                                                        <p className="text-xs font-medium text-slate-500 capitalize mb-1">{key}</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {(val as string[]).map((v, i) => (
                                                                                <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{v}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {summaryResult.metadata && (
                                                <div className="flex gap-2 flex-wrap">
                                                    {summaryResult.metadata.pageCount && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{summaryResult.metadata.pageCount} pages</span>}
                                                    {summaryResult.metadata.wordCount && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{summaryResult.metadata.wordCount} words</span>}
                                                    {summaryResult.metadata.estimatedReadTime && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">~{summaryResult.metadata.estimatedReadTime}</span>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── CLASSIFY TAB ── */}
                            {aiTab === 'classify' && (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleClassify}
                                        disabled={!!aiLoading}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
                                    >
                                        {aiLoading === 'classify' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                                        Identify Document Type
                                    </button>

                                    {classifyResult && (
                                        <div className="space-y-3">
                                            <div className="bg-slate-50 rounded-xl p-4 text-center">
                                                <p className="text-2xl font-bold text-violet-700 capitalize mb-1">{classifyResult.type}</p>
                                                <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                                                    <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${Math.round((classifyResult.confidence ?? 0) * 100)}%` }} />
                                                </div>
                                                <p className="text-xs text-slate-500">{Math.round((classifyResult.confidence ?? 0) * 100)}% confidence</p>
                                            </div>

                                            {classifyResult.suggestions?.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-600 mb-2">Suggested actions</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {classifyResult.suggestions.map((s: string, i: number) => (
                                                            <span key={i} className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full capitalize">{s.replace(/_/g, ' ')}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {classifyResult.metadata && (
                                                <div className="flex gap-2 flex-wrap">
                                                    {classifyResult.metadata.language && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">🌐 {classifyResult.metadata.language}</span>}
                                                    {classifyResult.metadata.containsTables && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">📊 Tables</span>}
                                                    {classifyResult.metadata.containsImages && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">🖼 Images</span>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── ACTIONS TAB ── */}
                            {aiTab === 'actions' && (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleActionItems}
                                        disabled={!!aiLoading}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
                                    >
                                        {aiLoading === 'actions' ? <Loader2 className="w-4 h-4 animate-spin" /> : <List className="w-4 h-4" />}
                                        Extract Action Items
                                    </button>

                                    {actionItems.length > 0 && (
                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-slate-600">{actionItems.length} items found</p>
                                            {actionItems.map((item, i) => (
                                                <label key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!checkedItems[i]}
                                                        onChange={e => setCheckedItems(prev => ({ ...prev, [i]: e.target.checked }))}
                                                        className="mt-0.5 accent-violet-600"
                                                    />
                                                    <span className={`text-xs leading-relaxed ${checkedItems[i] ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item}</span>
                                                </label>
                                            ))}
                                            <button
                                                onClick={() => copyText(actionItems.join('\n'))}
                                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mt-1"
                                            >
                                                <Copy className="w-3 h-3" />Copy all
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Q&A TAB ── */}
                            {aiTab === 'qa' && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-slate-600 flex items-center gap-1">
                                            Count:
                                            <input
                                                type="number" min={1} max={20} value={qaCount}
                                                onChange={e => setQaCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                                                className="w-14 text-xs border border-slate-200 rounded px-1.5 py-1 ml-1"
                                            />
                                        </label>
                                        <button
                                            onClick={handleQA}
                                            disabled={!!aiLoading}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600 text-white rounded-xl text-xs font-medium hover:bg-violet-700 disabled:opacity-50"
                                        >
                                            {aiLoading === 'qa' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                                            Generate Q&A
                                        </button>
                                    </div>

                                    {qaResult.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-slate-600">{qaResult.length} pairs</p>
                                            {qaResult.map((qa, i) => (
                                                <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() => setOpenQA(openQA === i ? null : i)}
                                                        className="w-full flex items-start gap-2 p-3 text-left hover:bg-slate-50 transition-colors"
                                                    >
                                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                                        <span className="text-xs font-medium text-slate-700 flex-1 leading-snug">{qa.question}</span>
                                                        {openQA === i ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />}
                                                    </button>
                                                    {openQA === i && (
                                                        <div className="px-3 pb-3 bg-violet-50 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                                                            <p className="pt-2">{qa.answer}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── EXTRACT TAB ── */}
                            {aiTab === 'extract' && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={extractType}
                                            onChange={e => setExtractType(e.target.value as any)}
                                            className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5"
                                        >
                                            {['auto','invoice','receipt','form','contract'].map(t => (
                                                <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleExtract}
                                            disabled={!!aiLoading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-medium hover:bg-violet-700 disabled:opacity-50"
                                        >
                                            {aiLoading === 'extract' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                                            Extract
                                        </button>
                                    </div>

                                    {extractResult && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-slate-600">Extracted Data</p>
                                                <button onClick={() => copyText(JSON.stringify(extractResult, null, 2))} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                                                    <Copy className="w-3 h-3" />JSON
                                                </button>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                                                {Object.entries(extractResult).filter(([, v]) => v !== null && v !== undefined && !Array.isArray(v) && typeof v !== 'object').map(([k, v]) => (
                                                    <div key={k} className="flex gap-2 text-xs">
                                                        <span className="font-medium text-slate-500 capitalize min-w-[80px]">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <span className="text-slate-700">{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Line items table */}
                                            {extractResult.lineItems?.length > 0 && (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead><tr className="bg-slate-100">
                                                            {Object.keys(extractResult.lineItems[0]).map(k => (
                                                                <th key={k} className="px-2 py-1 text-left font-semibold text-slate-600 capitalize">{k}</th>
                                                            ))}
                                                        </tr></thead>
                                                        <tbody>
                                                            {extractResult.lineItems.map((row: any, i: number) => (
                                                                <tr key={i} className="border-b border-slate-100">
                                                                    {Object.values(row).map((v: any, j) => (
                                                                        <td key={j} className="px-2 py-1 text-slate-700">{String(v)}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── TRANSLATE TAB ── */}
                            {aiTab === 'translate' && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        {languages.length > 0 ? (
                                            <select
                                                value={selectedLang}
                                                onChange={e => setSelectedLang(e.target.value)}
                                                className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5"
                                            >
                                                {languages.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type="text" value={selectedLang}
                                                onChange={e => setSelectedLang(e.target.value)}
                                                placeholder="Language name…"
                                                className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5"
                                            />
                                        )}
                                        <button
                                            onClick={handleTranslate}
                                            disabled={!!aiLoading || !selectedLang}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-medium hover:bg-violet-700 disabled:opacity-50"
                                        >
                                            {aiLoading === 'translate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                                            Translate
                                        </button>
                                    </div>

                                    {translateResult && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span>{translateResult.originalLanguage} → {translateResult.targetLanguage}</span>
                                                <div className="flex gap-2">
                                                    <span>{translateResult.characterCount?.toLocaleString()} chars</span>
                                                    <button onClick={() => copyText(translateResult.translatedText)} className="flex items-center gap-1 hover:text-slate-700">
                                                        <Copy className="w-3 h-3" />Copy
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const blob = new Blob([translateResult.translatedText], { type: 'text/plain' });
                                                            const a = window.document.createElement('a');
                                                            a.href = URL.createObjectURL(blob);
                                                            a.download = `translated_${translateResult.targetLanguage}.txt`;
                                                            a.click();
                                                        }}
                                                        className="flex items-center gap-1 hover:text-slate-700"
                                                    >
                                                        <Download className="w-3 h-3" />TXT
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                                                {translateResult.translatedText}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                {/* ████ SIGNATURE PICKER PANEL ████ */}
                {showSigPanel && (
                    <aside className="flex-shrink-0 w-68 bg-white border-l border-slate-200 flex flex-col" style={{ width: 260 }}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-800 text-sm">My Signatures</h3>
                            <button onClick={() => setShowSigPanel(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {signatures.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <PenTool className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                    <p className="text-sm mb-3">No signatures yet</p>
                                    <button onClick={() => navigate('/documents/signatures')} className="text-sm text-blue-600 hover:underline">
                                        Upload a signature →
                                    </button>
                                </div>
                            ) : signatures.map(sig => (
                                <button
                                    key={sig.id}
                                    onClick={() => { setPendingSig(sig); setShowSigPanel(false); setActiveTool('signature'); }}
                                    className={`w-full p-3 rounded-xl border-2 transition-all hover:border-blue-400 hover:bg-blue-50 text-left ${pendingSig?.id === sig.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
                                >
                                    <div className="h-10 flex items-center justify-center mb-1.5 bg-white rounded-lg border border-slate-100">
                                        <img src={sig.storageUrl} alt={sig.name} className="max-h-8 max-w-full object-contain" />
                                    </div>
                                    <p className="text-xs font-medium text-slate-700 text-center truncate">{sig.name}</p>
                                    {sig.isDefault && <p className="text-xs text-center text-blue-500 mt-0.5">✓ Default</p>}
                                </button>
                            ))}
                        </div>

                        <div className="p-3 border-t border-slate-200">
                            <button
                                onClick={() => navigate('/documents/signatures')}
                                className="w-full py-2 text-xs text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                + Manage Signatures
                            </button>
                        </div>
                    </aside>
                )}

                {/* ████ VERSION HISTORY PANEL ████ */}
                {showVersions && (
                    <aside className="flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden" style={{ width: 320 }}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4 text-emerald-600" />
                                <h3 className="font-semibold text-slate-800 text-sm">Version History</h3>
                            </div>
                            <button onClick={() => setShowVersions(false)} className="p-1 rounded-lg hover:bg-white/60 transition-colors">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        {/* Current version banner */}
                        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex-shrink-0">
                            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Current version — last updated {document ? new Date(document.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </p>
                        </div>

                        {/* Version list */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {versionsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                                </div>
                            ) : versions.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-slate-500">No previous versions</p>
                                    <p className="text-xs text-slate-400 mt-1">Each time you save your edits, a new version is created here.</p>
                                </div>
                            ) : (
                                versions
                                    .slice()
                                    .sort((a, b) => b.versionNumber - a.versionNumber)
                                    .map((v) => (
                                        <div
                                            key={v.id}
                                            className="bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                                                            v{v.versionNumber}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {new Date(v.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(v.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        {' · '}{(v.size / 1024).toFixed(0)} KB
                                                    </p>
                                                    {v.changeNote && (
                                                        <p className="text-xs text-slate-600 mt-1 italic">"{v.changeNote}"</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleRestoreVersion(v.versionNumber)}
                                                    disabled={restoringVersion !== null}
                                                    title={`Restore version ${v.versionNumber}`}
                                                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all disabled:opacity-50"
                                                >
                                                    {restoringVersion === v.versionNumber
                                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        : <RotateCcw className="w-3.5 h-3.5" />}
                                                    Restore
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>

                        <div className="px-4 py-3 border-t border-slate-200 flex-shrink-0">
                            <p className="text-xs text-slate-400 text-center">Restoring a version replaces the current file.</p>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
