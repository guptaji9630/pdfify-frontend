import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Axios instance with base configuration.
 * Timeout: 30s for most requests; AI endpoints may override individually.
 */
export const api = axios.create({
    baseURL: API_URL,
    timeout: 30_000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor to add auth token
 */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Response interceptor to handle errors
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect to login on 401 if the request had a token
        // (i.e., it was an authenticated request that failed)
        // Don't redirect on login/register failures
        if (error.response?.status === 401 && error.config?.headers?.Authorization) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==================== Auth API ====================

export const authAPI = {
    register: (email: string, password: string, name?: string) =>
        api.post('/api/auth/register', { email, password, name }),

    login: (email: string, password: string) =>
        api.post('/api/auth/login', { email, password }),

    getProfile: () => api.get('/api/auth/profile'),
};

// ==================== PDF API ====================

export const pdfAPI = {
    merge: async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));

        const response = await api.post('/api/pdf/merge', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            responseType: 'blob',
        });

        return response.data;
    },

    compress: async (file: File, quality: 'low' | 'medium' | 'high') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('quality', quality);

        const response = await api.post('/api/pdf/compress', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            responseType: 'blob',
        });

        return response.data;
    },

    /**
     * Split a PDF — backend expects `splitPoints` (comma-separated page numbers, e.g. "3,6")
     * Returns JSON: { data: { files: [{ name, pages, url }] } }
     */
    split: async (file: File, splitPoints: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('splitPoints', splitPoints);
        return api.post('/api/pdf/split', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    getMetadata: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/api/pdf/metadata', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// ==================== AI API ====================

/** Timeout for AI operations — LLM inference can be slow on large files */
const AI_TIMEOUT = 120_000;

export const aiAPI = {
    classify: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/ai/classify', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: AI_TIMEOUT,
        });

        return response.data;
    },

    summarize: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/ai/summarize', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: AI_TIMEOUT,
        });

        return response.data;
    },

    extractData: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/ai/extract-data', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: AI_TIMEOUT,
        });

        return response.data;
    },

    translate: async (file: File, targetLanguage: string, outputFormat: 'text' | 'pdf' = 'text') => {
        const formData = new FormData();
        formData.append('file', file);

        // Backend expects language as query parameter
        const params = new URLSearchParams();
        params.append('language', targetLanguage);
        if (outputFormat === 'pdf') {
            params.append('outputFormat', 'pdf');
        }

        const response = await api.post(`/api/ai/translate?${params.toString()}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            responseType: outputFormat === 'pdf' ? 'blob' : 'json',
            timeout: AI_TIMEOUT,
        });

        return response.data;
    },

    executiveSummary: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/ai/executive-summary', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: AI_TIMEOUT,
        });

        return response.data;
    },

    actionItems: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/ai/action-items', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: AI_TIMEOUT,
        });

        return response.data;
    },

    qaPairs: async (file: File, count: number = 5) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post(`/api/ai/qa-pairs?count=${count}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: AI_TIMEOUT,
        });

        return response.data;
    },

    smartCompress: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/ai/smart-compress', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            responseType: 'blob',
            timeout: AI_TIMEOUT,
        });

        return response.data;
    },

    getSupportedLanguages: async () => {
        const response = await api.get('/api/ai/languages');
        return response.data;
    },
};

// ==================== Billing API ====================


export const billingAPI = {
    /** Public — load plan details for pricing page */
    getPlans: () => api.get('/api/billing/plans'),

    /** Get current user's active subscription */
    getSubscription: () => api.get('/api/billing/subscription'),

    /**
     * Step 1 — Create a Razorpay order.
     * Returns: { orderId, amount, currency, keyId, plan, planName, planPrice }
     */
    createOrder: (plan: 'PRO' | 'BUSINESS') =>
        api.post('/api/billing/create-order', { plan }),

    /**
     * Step 2 — Verify Razorpay payment and activate plan.
     */
    verifyPayment: (data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        plan: 'PRO' | 'BUSINESS';
    }) => api.post('/api/billing/verify-payment', data),

    /** Downgrade back to FREE immediately */
    cancelSubscription: () => api.delete('/api/billing/subscription'),

    /** Enterprise contact form (public) */
    enterpriseContact: (data: {
        name: string; email: string; company: string;
        phone?: string; employees: string; message: string;
    }) => api.post('/api/billing/enterprise-contact', data),
};

// ==================== Document Management API ====================

export const documentAPI = {
    // Document CRUD
    create: (data: any) => api.post('/api/documents', data),
    
    upload: (file: File, title: string, isPublic: boolean = false, tags?: string[]) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('isPublic', String(isPublic));
        if (tags?.length) formData.append('tags', tags.join(','));
        
        return api.post('/api/documents/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    
    list: (filters?: { status?: string; type?: string; tags?: string; search?: string; page?: number; limit?: number }, signal?: AbortSignal) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.type) params.append('type', filters.type);
        if (filters?.tags) params.append('tags', filters.tags);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.limit) params.append('limit', String(filters.limit));
        const qs = params.toString();
        return api.get(`/api/documents${qs ? `?${qs}` : ''}`, { signal });
    },
    
    getById: (id: string) => api.get(`/api/documents/${id}`),
    
    update: (id: string, data: any) => api.patch(`/api/documents/${id}`, data),
    
    delete: (id: string) => api.delete(`/api/documents/${id}`),
    
    /**
     * Returns a 15-min signed GCS URL — do NOT download as blob.
     * Response shape: { data: { downloadUrl, filename, expiresIn } }
     * Usage: open response.data.data.downloadUrl in a new tab.
     */
    download: (id: string) => api.get(`/api/documents/${id}/download`),
    
    // Get PDF Page Info
    getPages: (id: string) => 
        api.get(`/api/documents/${id}/pages`),
    
    // Document Editing
    addText: (id: string, data: any) => 
        api.post(`/api/documents/${id}/edit/text`, data),
    
    drawShape: (id: string, data: any) => 
        api.post(`/api/documents/${id}/edit/draw-shape`, data),
    
    addImage: (id: string, data: any) => 
        api.post(`/api/documents/${id}/edit/add-image`, data),
    
    rearrangePages: (id: string, pageOrder: number[]) => 
        api.post(`/api/documents/${id}/edit/rearrange`, { pageOrder }),
    
    addPage: (id: string, position: number, content?: string) => 
        api.post(`/api/documents/${id}/edit/add-page`, { position, content }),
    
    removePages: (id: string, pageNumbers: number[]) => 
        api.post(`/api/documents/${id}/edit/remove-pages`, { pageNumbers }),
    
    rotatePages: (id: string, data: any) => 
        api.post(`/api/documents/${id}/edit/rotate-pages`, data),
    
    // Signatures
    uploadSignature: (file: File, name: string, isDefault: boolean = false) => {
        const formData = new FormData();
        formData.append('signature', file);
        formData.append('name', name);
        formData.append('isDefault', String(isDefault));
        
        return api.post('/api/documents/signatures', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    
    listSignatures: () => api.get('/api/documents/signatures'),
    
    deleteSignature: (id: string) => api.delete(`/api/documents/signatures/${id}`),
    
    /** POST /api/documents/signatures/:id/default */
    setDefaultSignature: (id: string) =>
        api.post(`/api/documents/signatures/${id}/default`, {}),

    /** POST /api/documents/:docId/apply-signature */
    applySignature: (docId: string, data: {
        signatureId: string; pageNumber: number;
        x: number; y: number; width: number; height: number;
    }) => api.post(`/api/documents/${docId}/apply-signature`, data),
    
    // Version Control
    getVersions: (docId: string) => 
        api.get(`/api/documents/${docId}/versions`),
    
    /** POST /api/documents/:docId/versions/:versionNumber/restore */
    restoreVersion: (docId: string, versionNumber: number) =>
        api.post(`/api/documents/${docId}/versions/${versionNumber}/restore`, {}),
    
    // Annotations
    createAnnotation: (docId: string, data: any) => 
        api.post(`/api/documents/${docId}/annotations`, data),
    
    listAnnotations: (docId: string, pageNumber?: number) => {
        const params = pageNumber ? `?pageNumber=${pageNumber}` : '';
        return api.get(`/api/documents/${docId}/annotations${params}`);
    },
    
    updateAnnotation: (docId: string, annotationId: string, data: any) =>
        api.patch(`/api/documents/${docId}/annotations/${annotationId}`, data),

    deleteAnnotation: (docId: string, annotationId: string) =>
        api.delete(`/api/documents/${docId}/annotations/${annotationId}`),

    /** Flatten all annotations into the PDF */
    burnAnnotations: (docId: string) =>
        api.post(`/api/documents/${docId}/annotations/burn`, {}),
    
    // ==================== AI Features on Stored Documents ====================

    // AI: Classify document type
    classifyDocument: (docId: string) =>
        api.post(`/api/documents/${docId}/ai/classify`, {}, { timeout: AI_TIMEOUT }),

    // AI: Summarize document
    summarizeDocument: (docId: string, length: 'short' | 'medium' | 'long' = 'medium') =>
        api.post(`/api/documents/${docId}/ai/summarize`, { length }, { timeout: AI_TIMEOUT }),

    // AI: Executive summary
    executiveSummary: (docId: string) =>
        api.post(`/api/documents/${docId}/ai/executive-summary`, {}, { timeout: AI_TIMEOUT }),

    // AI: Extract action items
    extractActionItems: (docId: string) =>
        api.post(`/api/documents/${docId}/ai/action-items`, {}, { timeout: AI_TIMEOUT }),

    // AI: Generate Q&A pairs
    generateQAPairs: (docId: string, count: number = 5) =>
        api.post(`/api/documents/${docId}/ai/qa-pairs?count=${count}`, {}, { timeout: AI_TIMEOUT }),

    // AI: Extract structured data
    extractDocumentData: (docId: string, type: 'auto' | 'invoice' | 'receipt' | 'form' | 'contract' = 'auto') =>
        api.post(`/api/documents/${docId}/ai/extract-data?type=${type}`, {}, { timeout: AI_TIMEOUT }),

    // AI: Translate document
    translateDocument: (docId: string, language: string) =>
        api.post(`/api/documents/${docId}/ai/translate?language=${language}`, {}, { timeout: AI_TIMEOUT }),
};
