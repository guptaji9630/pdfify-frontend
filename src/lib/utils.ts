import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useEffect, useRef, useState } from 'react';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Creates a debounced version of a function.
 * The returned function delays invoking `fn` until after `delay` ms
 * have elapsed since the last invocation.
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * React hook that debounces a value.
 * Returns the debounced value after `delay` ms without changes.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

/**
 * React hook that returns the current container width via ResizeObserver.
 * Pass the ref to the element you want to observe.
 */
export function useContainerWidth(ref: React.RefObject<HTMLElement | null>, defaultWidth = 0): number {
    const [width, setWidth] = useState<number>(defaultWidth);
    const savedRef = useRef(ref);
    savedRef.current = ref;

    useEffect(() => {
        const el = savedRef.current.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width;
            if (w != null) setWidth(w);
        });
        ro.observe(el);
        // Capture initial width immediately
        setWidth(el.getBoundingClientRect().width);
        return () => ro.disconnect();
    }, []);

    return width;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
