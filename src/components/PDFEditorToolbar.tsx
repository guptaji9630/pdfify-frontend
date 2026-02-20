import { useState } from 'react';
import { documentAPI } from '../lib/api';
import { DrawShapeData, AddTextData, AddImageData, RotatePagesData } from '../types';
import {
    Type,
    Square,
    Circle,
    Minus,
    Image as ImageIcon,
    RotateCw,
    Loader2,
} from 'lucide-react';

interface PDFEditorToolbarProps {
    documentId: string;
    currentPage: number;
    onDocumentUpdated: () => void;
}

export default function PDFEditorToolbar({
    documentId,
    currentPage,
    onDocumentUpdated,
}: PDFEditorToolbarProps) {
    const [activeTool, setActiveTool] = useState<'text' | 'rectangle' | 'circle' | 'line' | 'image' | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAddText = async () => {
        const text = prompt('Enter text to add:');
        if (!text) return;

        const fontSize = prompt('Font size (default 12):', '12');
        const x = prompt('X position (points from left, default 100):', '100');
        const y = prompt('Y position (points from bottom, default 700):', '700');

        try {
            setLoading(true);
            const data: AddTextData = {
                pageNumber: currentPage,
                x: Number(x),
                y: Number(y),
                text,
                fontSize: Number(fontSize),
            };
            await documentAPI.addText(documentId, data);
            alert('Text added successfully!');
            onDocumentUpdated();
        } catch (err: any) {
            alert('Failed to add text: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
            setActiveTool(null);
        }
    };

    const handleDrawShape = async (shape: 'rectangle' | 'circle' | 'line') => {
        const x = prompt('X position (points from left, default 50):', '50');
        const y = prompt('Y position (points from bottom, default 600):', '600');
        const width = prompt('Width (default 200):', '200');
        const height = prompt('Height (default 100):', '100');
        const color = prompt('Border color (hex, default #0000FF):', '#0000FF');

        try {
            setLoading(true);
            const data: DrawShapeData = {
                pageNumber: currentPage,
                shape,
                x: Number(x),
                y: Number(y),
                width: Number(width),
                height: Number(height),
                color: color || undefined,
            };
            await documentAPI.drawShape(documentId, data);
            alert('Shape added successfully!');
            onDocumentUpdated();
        } catch (err: any) {
            alert('Failed to draw shape: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
            setActiveTool(null);
        }
    };

    const handleAddImage = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg';
        input.onchange = async (e: any) => {
            const file = e.target?.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const dataUrl = event.target?.result as string;
                const base64 = dataUrl.split(',')[1];
                const mimeType = file.type as 'image/png' | 'image/jpeg';

                const x = prompt('X position (points from left, default 200):', '200');
                const y = prompt('Y position (points from bottom, default 400):', '400');
                const width = prompt('Width (optional, press Cancel for natural size):');
                const height = prompt('Height (optional, press Cancel for natural size):');

                try {
                    setLoading(true);
                    const data: AddImageData = {
                        pageNumber: currentPage,
                        imageBase64: base64,
                        mimeType,
                        x: Number(x),
                        y: Number(y),
                    };
                    if (width) data.width = Number(width);
                    if (height) data.height = Number(height);

                    await documentAPI.addImage(documentId, data);
                    alert('Image added successfully!');
                    onDocumentUpdated();
                } catch (err: any) {
                    alert('Failed to add image: ' + (err.response?.data?.error || err.message));
                } finally {
                    setLoading(false);
                    setActiveTool(null);
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const handleRotatePage = async () => {
        const rotation = prompt('Rotation angle (90, 180, or 270):', '90');
        if (!rotation || !['90', '180', '270'].includes(rotation)) {
            alert('Invalid rotation angle');
            return;
        }

        try {
            setLoading(true);
            const data: RotatePagesData = {
                pageNumbers: [currentPage],
                rotation: Number(rotation) as 90 | 180 | 270,
            };
            await documentAPI.rotatePages(documentId, data);
            alert('Page rotated successfully!');
            onDocumentUpdated();
        } catch (err: any) {
            alert('Failed to rotate page: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-gray-800">Edit Tools</h3>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={handleAddText}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 flex items-center gap-2"
                >
                    <Type className="w-4 h-4" />
                    Add Text
                </button>
                <button
                    onClick={() => handleDrawShape('rectangle')}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 flex items-center gap-2"
                >
                    <Square className="w-4 h-4" />
                    Rectangle
                </button>
                <button
                    onClick={() => handleDrawShape('circle')}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 flex items-center gap-2"
                >
                    <Circle className="w-4 h-4" />
                    Circle
                </button>
                <button
                    onClick={() => handleDrawShape('line')}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 flex items-center gap-2"
                >
                    <Minus className="w-4 h-4" />
                    Line
                </button>
                <button
                    onClick={handleAddImage}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 flex items-center gap-2"
                >
                    <ImageIcon className="w-4 h-4" />
                    Add Image
                </button>
                <button
                    onClick={handleRotatePage}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 flex items-center gap-2"
                >
                    <RotateCw className="w-4 h-4" />
                    Rotate Page
                </button>
            </div>

            {activeTool && (
                <div className="mt-3 text-sm text-gray-600">
                    <p>
                        <strong>Note:</strong> Click on the PDF to place your {activeTool === 'text' ? 'text' : 'shape'}.
                    </p>
                </div>
            )}
        </div>
    );
}
