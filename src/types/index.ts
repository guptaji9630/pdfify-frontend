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
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    daysRemaining?: number;
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

// ==================== Document Management Types ====================

export type DocumentType = 'PDF' | 'DOC' | 'DOCX';
export type DocumentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AnnotationType = 'HIGHLIGHT' | 'COMMENT' | 'SHAPE' | 'TEXT' | 'DRAWING';

export interface Document {
    id: string;
    title: string;
    description?: string;
    type: DocumentType;
    status: DocumentStatus;
    storageUrl: string;
    thumbnailUrl?: string;
    pageCount: number;
    size: number;
    isPublic: boolean;
    tags: string[];
    userId: string;
    createdAt: string;
    updatedAt: string;
    versions?: DocumentVersion[];
    annotations?: Annotation[];
    _count?: {
        versions: number;
        annotations: number;
    };
}

export interface DocumentVersion {
    id: string;
    documentId: string;
    versionNumber: number;
    storageUrl: string;
    size: number;
    changeNote?: string;
    createdAt: string;
    createdBy: string;
}

export interface Signature {
    id: string;
    name: string;
    storageUrl: string;
    width: number;
    height: number;
    isDefault: boolean;
    userId: string;
    createdAt: string;
}

export interface Annotation {
    id: string;
    documentId: string;
    type: AnnotationType;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    color: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDocumentDto {
    title: string;
    description?: string;
    type: DocumentType;
    content: string;
    isPublic?: boolean;
    tags?: string[];
}

export interface UpdateDocumentDto {
    title?: string;
    description?: string;
    status?: DocumentStatus;
    isPublic?: boolean;
    tags?: string[];
}

export interface DocumentFilters {
    status?: DocumentStatus;
    type?: DocumentType;
    tags?: string;
    search?: string;
}

export interface SignaturePosition {
    signatureId: string;
    pageNumber: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
}

// ==================== PDF Page Types ====================

export interface PDFPageInfo {
    pageNumber: number;
    width: number;
    height: number;
    rotation: number;
}

export interface PDFPagesResponse {
    pageCount: number;
    pages: PDFPageInfo[];
}

// ==================== PDF Editing Types ====================

export interface AddTextData {
    pageNumber: number;
    x: number;
    y: number;
    text: string;
    fontSize?: number;
    color?: string;
}

export interface DrawShapeData {
    pageNumber: number;
    shape: 'rectangle' | 'line' | 'circle' | 'arrow';
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
    fillColor?: string;
    strokeWidth?: number;
}

export interface AddImageData {
    pageNumber: number;
    imageBase64: string;
    mimeType: 'image/png' | 'image/jpeg';
    x: number;
    y: number;
    width?: number;
    height?: number;
}

export interface RotatePagesData {
    pageNumbers: number[];
    rotation: 90 | 180 | 270;
}

// ==================== Billing Types ====================

export type PlanId = 'FREE' | 'PRO' | 'BUSINESS';

export interface BillingPlan {
    id: PlanId;
    name: string;
    price: number;
    currency: string;
    priceInPaise: number;
    billingPeriod: string;
    popular?: boolean;
    features: string[];
}

export interface BillingSubscription {
    plan: PlanId;
    status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED';
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    daysRemaining?: number;
}

export interface RazorpayOrder {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    plan: PlanId;
    planName: string;
    planPrice: number;
}

export interface EnterpriseInfo {
    name: string;
    description: string;
    highlights: string[];
}



export interface ClassifyResponse {
    type: string;
    confidence: number;
    suggestions: string[];
    metadata: {
        language: string;
        containsImages: boolean;
        containsTables: boolean;
    };
}

export interface SummarizeResponse {
    summary: string;
    keyPoints: string[];
    metadata: {
        pageCount: number;
        wordCount: number;
        estimatedReadTime: string;
    };
    entities: {
        dates: string[];
        amounts: string[];
        people: string[];
        organizations: string[];
    };
}

export interface ExecutiveSummaryResponse {
    summary: string;
}

export interface ActionItemsResponse {
    actionItems: string[];
    count: number;
}

export interface QAPairsResponse {
    qaPairs: Array<{
        question: string;
        answer: string;
    }>;
    count: number;
}

export interface ExtractDataResponse {
    [key: string]: any;
    invoiceNumber?: string;
    vendor?: string;
    date?: string;
    dueDate?: string;
    lineItems?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    subtotal?: number;
    tax?: number;
    total?: number;
}

export interface TranslateResponse {
    translatedText: string;
    originalLanguage: string;
    targetLanguage: string;
    pageCount: number;
    characterCount: number;
}

export interface LanguagesResponse {
    languages: string[];
    count: number;
}
