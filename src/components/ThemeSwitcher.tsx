import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore, ThemeMode } from '../store/themeStore';

const ORDER: ThemeMode[] = ['light', 'dark', 'system'];

const META: Record<ThemeMode, { label: string; Icon: typeof Sun }> = {
    light: { label: 'Light', Icon: Sun },
    dark: { label: 'Dark', Icon: Moon },
    system: { label: 'System', Icon: Monitor },
};

/**
 * Compact inline theme toggle button — place it inside any header/nav.
 * Clicking cycles: Light → Dark → System → Light.
 */
export default function ThemeToggle() {
    const { mode, setMode } = useThemeStore();
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    const { Icon, label } = META[mode];

    return (
        <button
            title={`Theme: ${label} — click for ${META[next].label}`}
            aria-label={`Switch theme (currently ${label})`}
            onClick={() => setMode(next)}
            className="flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
            <Icon className="h-5 w-5" />
        </button>
    );
}
