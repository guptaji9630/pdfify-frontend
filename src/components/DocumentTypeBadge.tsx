interface DocumentTypeBadgeProps {
    type: string;
    confidence?: number;
}

const typeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    invoice: { label: 'Invoice', color: 'text-green-700', bgColor: 'bg-green-100' },
    contract: { label: 'Contract', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    resume: { label: 'Resume', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    report: { label: 'Report', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    form: { label: 'Form', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    ebook: { label: 'E-Book', color: 'text-pink-700', bgColor: 'bg-pink-100' },
    letter: { label: 'Letter', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    other: { label: 'Other', color: 'text-slate-700', bgColor: 'bg-slate-100' },
};

export default function DocumentTypeBadge({ type, confidence }: DocumentTypeBadgeProps) {
    const config = typeConfig[type.toLowerCase()] || typeConfig.other;

    return (
        <div className="inline-flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${config.bgColor} ${config.color}`}>
                {config.label}
            </span>
            {confidence && (
                <span className="text-xs text-slate-500">
                    {(confidence * 100).toFixed(0)}% confidence
                </span>
            )}
        </div>
    );
}
