import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Axios instance with base configuration
 */
export const api = axios.create({
    baseURL: API_URL,
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
        if (error.response?.status === 401) {
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

        return response;
    },

    split: async (file: File, options: { pages?: string }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (options.pages) formData.append('pages', options.pages);

        const response = await api.post('/api/pdf/split', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            responseType: 'blob',
        });

        return response.data;
    },
};

// ==================== AI API ====================

export const aiAPI = {
    classify: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/ai/classify', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return response.data;
    },

    summarize: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/api/ai/summarize', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return response.data;
    },
};

// ==================== Billing API ====================

export const billingAPI = {
    createSubscription: (plan: 'pro' | 'business') =>
        api.post('/api/billing/create-subscription', { plan }),

    cancelSubscription: () => api.post('/api/billing/cancel-subscription'),

    getPaymentHistory: () => api.get('/api/billing/payments'),
};
