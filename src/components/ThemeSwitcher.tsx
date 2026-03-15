import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemeMode } from '../store/themeStore';

interface ThemeSwitcherProps {
    mode: ThemeMode;
    resolvedMode: 'light' | 'dark';
    onModeChange: (mode: ThemeMode) => void;
}

const modeMeta: Record<ThemeMode, { label: string; Icon: typeof Sun }> = {
    light: { label: 'Light', Icon: Sun },
    dark: { label: 'Dark', Icon: Moon },
    system: { label: 'System', Icon: Monitor },
};

export default function ThemeSwitcher({ mode, resolvedMode, onModeChange }: ThemeSwitcherProps) {
    const ActiveIcon = modeMeta[mode].Icon;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                <ActiveIcon className="h-3.5 w-3.5" />
                <span>{modeMeta[mode].label}</span>
                <span className="text-slate-400 dark:text-slate-500">({resolvedMode})</span>
            </div>

            <select
                aria-label="Theme mode"
                value={mode}
                onChange={(e) => onModeChange(e.target.value as ThemeMode)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none ring-blue-500 transition focus:ring-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
            </select>
        </div>
    );
}
