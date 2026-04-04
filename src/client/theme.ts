/**
 * Dark mode toggle.
 * The inline script in <head> sets .dark on <html> before paint to prevent flash.
 * This module syncs <body>, binds toggle switches, and handles system preference changes.
 */

const STORAGE_KEY = 'compodocx_darkmode-state';

const getSystemPreference = (): boolean =>
    window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyDarkMode = (dark: boolean) => {
    document.documentElement.classList.toggle('dark', dark);
    document.body.classList.toggle('dark', dark);
    document.querySelectorAll<HTMLInputElement>('.dark-mode-switch input').forEach(el => {
        el.checked = dark;
    });
    document.querySelectorAll<HTMLElement>('.dark-mode-switch').forEach(el => {
        el.classList.toggle('dark', dark);
        el.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    });
    try {
        localStorage.setItem(STORAGE_KEY, String(dark));
    } catch { /* localStorage blocked */ }
};

export const initTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const dark = stored !== null ? stored === 'true' : getSystemPreference();
    applyDarkMode(dark);

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        applyDarkMode(e.matches);
    });

    // Bind toggle switches
    document.querySelectorAll<HTMLInputElement>('.dark-mode-switch input').forEach(el => {
        el.addEventListener('change', () => {
            const current = document.documentElement.classList.contains('dark');
            applyDarkMode(!current);
        });
    });
};
