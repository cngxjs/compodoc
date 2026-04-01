type Highlighter = {
    codeToHtml(code: string, options: unknown): string;
};

let highlighter: Highlighter | null = null;

const THEME_LIGHT = 'github-light';
const THEME_DARK = 'github-dark';

const SUPPORTED_LANGUAGES = [
    'typescript',
    'javascript',
    'html',
    'css',
    'scss',
    'json',
    'bash',
    'markdown'
];

/**
 * Initialize the Shiki highlighter singleton.
 * Must be called once before any highlight calls (async because Shiki loads WASM).
 * Uses dynamic import() to avoid ESM/CJS warnings.
 */
export async function initHighlighter(): Promise<void> {
    if (highlighter) return;
    const { createHighlighter } = await import('shiki');
    highlighter = await createHighlighter({
        themes: [THEME_LIGHT, THEME_DARK],
        langs: SUPPORTED_LANGUAGES
    });
}

/**
 * Highlight source code and return an HTML string.
 * Falls back to escaped plain text if the highlighter is not initialized.
 */
export function highlightCode(code: string, lang: string = 'typescript'): string {
    if (!highlighter) {
        return escapeHtml(code);
    }

    const resolvedLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'typescript';

    return highlighter.codeToHtml(code, {
        lang: resolvedLang,
        themes: {
            light: THEME_LIGHT,
            dark: THEME_DARK
        }
    });
}

function escapeHtml(str: string): string {
    return str
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}
