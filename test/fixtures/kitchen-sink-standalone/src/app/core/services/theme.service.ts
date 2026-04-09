import { Injectable, signal, computed, effect } from '@angular/core';

/**
 * Theme options.
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Service for managing the application theme using signals.
 *
 * Persists theme preference to localStorage and applies it to the document.
 *
 * @example
 * ```typescript
 * const theme = inject(ThemeService);
 * theme.setTheme('dark');
 * console.log(theme.isDark()); // true
 * ```
 *
 * @since 2.0.0
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
    /**
     * The current theme as a signal.
     */
    readonly currentTheme = signal<Theme>('system');

    /**
     * Whether dark mode is active.
     */
    readonly isDark = computed(() => {
        const theme = this.currentTheme();
        if (theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return theme === 'dark';
    });

    /**
     * CSS class name for the current theme.
     */
    readonly themeClass = computed(() => `theme-${this.currentTheme()}`);

    constructor() {
        const saved = localStorage.getItem('theme') as Theme | null;
        if (saved) this.currentTheme.set(saved);

        effect(() => {
            const theme = this.currentTheme();
            localStorage.setItem('theme', theme);
            document.documentElement.setAttribute('data-theme', theme);
        });
    }

    /**
     * Set the theme.
     *
     * @param theme - The theme to apply
     */
    setTheme(theme: Theme): void {
        this.currentTheme.set(theme);
    }

    /**
     * Toggle between light and dark.
     */
    toggle(): void {
        this.currentTheme.update((t) => (t === 'dark' ? 'light' : 'dark'));
    }
}
