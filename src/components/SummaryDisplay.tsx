import { useState } from 'react';

interface SummaryData {
    summary?: string;
    keyPoints?: string[];
    entities?: {
        dates?: string[];
        amounts?: string[];
        people?: string[];
        organizations?: string[];
    };
    metadata?: {
        pageCount?: number;
        wordCount?: number;
        estimatedReadTime?: string;
    };
}

interface SummaryDisplayProps {
    summary: string | SummaryData;
    fileName?: string;
}

export default function SummaryDisplay({ summary, fileName }: SummaryDisplayProps) {
    const [copied, setCopied] = useState(false);

    // Parse structured response or plain text
    const isStructured = typeof summary === 'object';
    const summaryData = isStructured ? summary : null;
    const plainText = !isStructured ? summary : summaryData?.summary || '';

    const handleCopy = async () => {
        try {
            const textToCopy = isStructured 
                ? `${summaryData?.summary || ''}\n\nKey Points:\n${summaryData?.keyPoints?.map(p => `• ${p}`).join('\n') || ''}`
                : plainText;
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-blue-200 bg-white/50">
                <div>
                    <h3 className="font-bold text-lg text-slate-900">📄 Document Summary</h3>
                    {fileName && (
                        <p className="text-xs text-slate-600 mt-1">{fileName}</p>
                    )}
                </div>
                <button
                    onClick={handleCopy}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 bg-white rounded-lg transition-colors shadow-sm"
                >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
            </div>

            <div className="p-5 space-y-5">
                {/* Metadata */}
                {summaryData?.metadata && (
                    <div className="flex flex-wrap gap-3">
                        {summaryData.metadata.pageCount && (
                            <span className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-slate-600 shadow-sm">
                                📑 {summaryData.metadata.pageCount} pages
                            </span>
                        )}
                        {summaryData.metadata.wordCount && (
                            <span className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-slate-600 shadow-sm">
                                📝 {summaryData.metadata.wordCount.toLocaleString()} words
                            </span>
                        )}
                        {summaryData.metadata.estimatedReadTime && (
                            <span className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-slate-600 shadow-sm">
                                ⏱️ {summaryData.metadata.estimatedReadTime} read
                            </span>
                        )}
                    </div>
                )}

                {/* Main Summary */}
                {(summaryData?.summary || plainText) && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-slate-900 mb-2 text-sm uppercase tracking-wide">Overview</h4>
                        <p className="text-slate-700 leading-relaxed">
                            {summaryData?.summary || plainText}
                        </p>
                    </div>
                )}

                {/* Key Points */}
                {summaryData?.keyPoints && summaryData.keyPoints.length > 0 && (
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wide">🔑 Key Points</h4>
                        <ul className="space-y-2">
                            {summaryData.keyPoints.map((point, index) => (
                                <li key={index} className="flex gap-2.5 text-slate-700">
                                    <span className="text-blue-500 font-bold mt-0.5 flex-shrink-0">{index + 1}.</span>
                                    <span className="leading-relaxed">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Entities */}
                {summaryData?.entities && (
                    <div className="grid md:grid-cols-2 gap-4">
                        {summaryData.entities.organizations && summaryData.entities.organizations.length > 0 && (
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-2">
                                    <span>🏢</span> Organizations
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {summaryData.entities.organizations.map((org, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                            {org}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {summaryData.entities.people && summaryData.entities.people.length > 0 && (
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-2">
                                    <span>👥</span> People
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {summaryData.entities.people.map((person, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                            {person}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {summaryData.entities.amounts && summaryData.entities.amounts.length > 0 && (
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-2">
                                    <span>💰</span> Amounts
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {summaryData.entities.amounts.map((amount, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                            {amount}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {summaryData.entities.dates && summaryData.entities.dates.length > 0 && (
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-semibold text-slate-900 mb-2 text-sm flex items-center gap-2">
                                    <span>📅</span> Dates
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {summaryData.entities.dates.map((date, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                            {date}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
