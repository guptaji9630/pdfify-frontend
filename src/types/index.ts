export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
    subscription?: Subscription;
}

export interface Subscription {
    id: string;
    plan: 'FREE' | 'PRO' | 'BUSINESS';
    status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED';
    currentPeriodEnd?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface FileUploadState {
    file: File | null;
    progress: number;
    status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
    error?: string;
}

export interface PDFOperation {
    type: 'merge' | 'compress' | 'split' | 'convert';
    files: File[];
    options?: any;
}
