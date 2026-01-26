import React, { useCallback, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FileUploaderProps {
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in bytes
    onFilesChange: (files: File[]) => void;
    maxFiles?: number;
}

export default function FileUploader({
    accept = '.pdf',
    multiple = false,
    maxSize = 50 * 1024 * 1024, // 50MB default
    onFilesChange,
    maxFiles = 10,
}: FileUploaderProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string>('');

    const validateFile = (file: File): string | null => {
        // Check file type
        if (accept && !file.name.endsWith('.pdf')) {
            return `Invalid file type. Only PDF files are allowed.`;
        }

        // Check file size
        if (maxSize && file.size > maxSize) {
            return `File size exceeds ${formatFileSize(maxSize)}`;
        }

        return null;
    };

    const handleFiles = useCallback(
        (newFiles: FileList | null) => {
            if (!newFiles) return;

            setError('');
            const fileArray = Array.from(newFiles);

            // Validate each file
            for (const file of fileArray) {
                const validationError = validateFile(file);
                if (validationError) {
                    setError(validationError);
                    return;
                }
            }

            // Check max files
            const totalFiles = multiple ? files.length + fileArray.length : fileArray.length;
            if (totalFiles > maxFiles) {
                setError(`Maximum ${maxFiles} files allowed`);
                return;
            }

            const updatedFiles = multiple ? [...files, ...fileArray] : fileArray;
            setFiles(updatedFiles);
            onFilesChange(updatedFiles);
        },
        [files, multiple, maxFiles, onFilesChange]
    );

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    return (
        <div className="w-full">
            {/* Drop Zone */}
            <div
                className={`
          relative border-2 border-dashed rounded-xl p-8 text-center
          transition-colors duration-200 cursor-pointer
          ${dragActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-300 hover:border-gray-400'
                    }
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
            >
                <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => handleFiles(e.target.files)}
                />

                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

                <h3 className="text-lg font-semibold mb-2">
                    {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
                </h3>

                <p className="text-sm text-gray-500">
                    {multiple ? 'PDF files (up to ' + maxFiles + ')' : 'PDF file only'}
                    {' · '}Max {formatFileSize(maxSize)}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="mt-6 space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        Selected Files ({files.length})
                    </h4>
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                aria-label="Remove file"
                            >
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
