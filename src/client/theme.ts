/**
 * Dark mode toggle.
 * Replaces inline script in page.hbs.
 */

const STORAGE_KEY = 'compodocx_darkmode-state';

const getSystemPreference = (): boolean =>
    window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyDarkMode = (dark: boolean) => {
    document.body.classList.toggle('dark', dark);
    document.querySelectorAll<HTMLInputElement>('.dark-mode-switch input').forEach(el => {
        el.checked = dark;
    });
    document.querySelectorAll('.dark-mode-switch').forEach(el => {
        el.classList.toggle('dark', dark);
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
            const current = document.body.classList.contains('dark');
            applyDarkMode(!current);
        });
    });
};
