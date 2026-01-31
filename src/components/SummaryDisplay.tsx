import { useState } from 'react';

interface SummaryDisplayProps {
    summary: string;
    fileName?: string;
}

export default function SummaryDisplay({ summary, fileName }: SummaryDisplayProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(summary);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Parse bullet points if summary contains them
    const lines = summary.split('\n').filter(line => line.trim());
    const isBulletList = lines.some(line => line.trim().startsWith('-') || line.trim().startsWith('•'));

    return (
        <div className="bg-white rounded-lg border border-slate-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
                <div>
                    <h3 className="font-semibold text-slate-900">Summary</h3>
                    {fileName && (
                        <p className="text-xs text-slate-500 mt-1">{fileName}</p>
                    )}
                </div>
                <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    {copied ? '✓ Copied' : 'Copy'}
                </button>
            </div>

            <div className="p-4">
                {isBulletList ? (
                    <ul className="space-y-2">
                        {lines.map((line, index) => {
                            const cleanLine = line.replace(/^[-•]\s*/, '').trim();
                            if (!cleanLine) return null;
                            return (
                                <li key={index} className="flex gap-2 text-slate-700">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span>{cleanLine}</span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {summary}
                    </p>
                )}
            </div>
        </div>
    );
}
