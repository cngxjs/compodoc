/**
 * Command palette (Cmd+K / Ctrl+K).
 * Pagefind-powered search with entity type badges and keyboard navigation.
 */

const DIALOG_ID = 'cdx-command-palette';
const INPUT_SELECTOR = '.cdx-cp-input';
const LIST_SELECTOR = '.cdx-cp-results';
const EMPTY_SELECTOR = '.cdx-cp-empty';
const LOADING_SELECTOR = '.cdx-cp-loading';
const THROTTLE_MS = 150;

/** Entity type extracted from Pagefind page titles (e.g. "component - MyComponent") */
const ENTITY_TYPES = [
    'component',
    'directive',
    'service',
    'injectable',
    'pipe',
    'module',
    'class',
    'interface',
    'guard',
    'interceptor',
    'enum',
    'function',
    'typealias',
    'variable'
] as const;

type EntityType = (typeof ENTITY_TYPES)[number];

/** Map entity types to CSS class suffixes (matching design system token names) */
const entityClass = (type: EntityType | 'other'): string => {
    switch (type) {
        case 'service':
        case 'injectable':
            return 'service';
        case 'component':
            return 'component';
        case 'directive':
            return 'directive';
        case 'pipe':
            return 'pipe';
        case 'module':
            return 'module';
        case 'class':
            return 'class';
        case 'interface':
            return 'interface';
        case 'guard':
            return 'guard';
        case 'interceptor':
            return 'interceptor';
        default:
            return 'other';
    }
};

/** Parse entity type from Pagefind result title.
 *  Titles follow pattern: "EntityName - context - ProjectName" (from Layout.tsx pageTitle()).
 *  Also handles legacy "type - EntityName" format. */
const parseEntityType = (title: string): { type: EntityType | 'other'; name: string } => {
    // Try new format: "EntityName - context - ProjectName"
    const parts = title.split(' - ');
    if (parts.length >= 3) {
        const name = parts[0].trim();
        const context = parts[1].trim().toLowerCase();
        for (const t of ENTITY_TYPES) {
            if (context === t || context === `${t}s` || context.includes(t)) {
                return { type: t, name };
            }
        }
        // Context didn't match a known entity type (e.g. "coverage", "routes")
        return { type: 'other', name };
    }
    // Try legacy format: "type - EntityName"
    const lower = title.toLowerCase();
    for (const t of ENTITY_TYPES) {
        if (lower.startsWith(`${t} - `) || lower.startsWith(`${t}s - `)) {
            const name = title.substring(title.indexOf(' - ') + 3);
            return { type: t, name };
        }
    }
    return { type: 'other', name: title };
};

/** Capitalize first letter */
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Type label for display -- shows entity type like angular.dev */
const typeLabel = (type: EntityType | 'other'): string => {
    if (type === 'other') {
        return 'Docs';
    }
    return cap(type === 'typealias' ? 'Type Alias' : type);
};

/** SVG icon per entity type (matches sidebar Icons.tsx) */
const icon = (paths: string): string =>
    `<svg class="cdx-cp-result-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const RESULT_ICONS: Record<string, string> = {
    component: icon(
        '<path d="M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z"/><path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z"/><path d="M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5Z"/><path d="m12 15 3.5 3.5L12 22l-3.5-3.5L12 15Z"/>'
    ),
    directive: icon('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
    pipe: icon('<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>'),
    module: icon(
        '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.84Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'
    ),
    class: icon(
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>'
    ),
    injectable: icon(
        '<path d="m18 2 4 4-4 4"/><path d="m6 22-4-4 4-4"/><path d="M22 6H10a4 4 0 0 0-4 4v4"/><path d="M2 18h12a4 4 0 0 0 4-4v-4"/>'
    ),
    service: icon(
        '<path d="m18 2 4 4-4 4"/><path d="m6 22-4-4 4-4"/><path d="M22 6H10a4 4 0 0 0-4 4v4"/><path d="M2 18h12a4 4 0 0 0 4-4v-4"/>'
    ),
    interface: icon(
        '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"/><path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/>'
    ),
    guard: icon(
        '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
    ),
    interceptor: icon(
        '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>'
    ),
    enum: icon(
        '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>'
    ),
    function: icon(
        '<path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2H12"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>'
    ),
    variable: icon(
        '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>'
    ),
    typealias: icon('<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>')
};

const resultIcon = (type: EntityType | 'other'): string =>
    RESULT_ICONS[type] ??
    icon(
        '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>'
    );

/** Highlight matched query terms in text */
const highlightMatch = (text: string, query: string): string => {
    if (!query.trim()) {
        return escapeHtml(text);
    }
    const escaped = escapeHtml(text);
    const terms = query
        .trim()
        .split(/\s+/)
        .filter(t => t.length > 1);
    if (terms.length === 0) {
        return escaped;
    }

    const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const re = new RegExp(`(${pattern})`, 'gi');
    return escaped.replace(re, '<mark class="cdx-cp-highlight">$1</mark>');
};

interface SearchResult {
    readonly title: string;
    readonly url: string;
    readonly type: EntityType | 'other';
    readonly name: string;
}

let pagefind: any = null;
let activeIndex = -1;
let lastQuery = '';
let throttleTimer: ReturnType<typeof setTimeout> | undefined;

const getDialog = (): HTMLDialogElement | null =>
    document.getElementById(DIALOG_ID) as HTMLDialogElement | null;

const getInput = (): HTMLInputElement | null => getDialog()?.querySelector(INPUT_SELECTOR) ?? null;

const getList = (): HTMLElement | null => getDialog()?.querySelector(LIST_SELECTOR) ?? null;

const getEmpty = (): HTMLElement | null => getDialog()?.querySelector(EMPTY_SELECTOR) ?? null;

const getLoading = (): HTMLElement | null => getDialog()?.querySelector(LOADING_SELECTOR) ?? null;

/** Load Pagefind lazily */
const loadPagefind = async (): Promise<any> => {
    if (pagefind) {
        return pagefind;
    }
    if (window.location.protocol === 'file:') {
        return null;
    }

    // Build absolute URL to pagefind based on page location (not module location)
    const depth = (window as any).COMPODOC_CURRENT_PAGE_DEPTH ?? 0;
    const prefix = depth === 0 ? '' : '../'.repeat(depth);
    const pagefindUrl = new URL(`${prefix}pagefind/pagefind.js`, window.location.href).href;

    const loading = getLoading();
    if (loading) {
        loading.hidden = false;
    }

    try {
        pagefind = await import(/* @vite-ignore */ pagefindUrl);
        await pagefind.init();
        if (loading) {
            loading.hidden = true;
        }
        return pagefind;
    } catch (e) {
        console.warn('Search unavailable:', (e as Error).message);
        if (loading) {
            loading.hidden = true;
        }
        return null;
    }
};

/** Perform search and render results */
const search = async (query: string) => {
    const list = getList();
    const empty = getEmpty();
    if (!list || !empty) {
        return;
    }

    if (!query.trim()) {
        list.innerHTML = '';
        empty.hidden = false;
        empty.textContent = 'Start typing to see results';
        activeIndex = -1;
        return;
    }

    const pf = await loadPagefind();
    if (!pf) {
        empty.hidden = false;
        empty.textContent = 'Search unavailable (requires HTTP server)';
        return;
    }

    const maxResults = (window as any).MAX_SEARCH_RESULTS ?? 15;
    const results = await pf.search(query);
    const sliced = results.results.slice(0, maxResults);
    const data = await Promise.all(sliced.map((r: any) => r.data()));

    const mapped: SearchResult[] = data.map((d: any) => {
        const parsed = parseEntityType(d.meta.title || '');
        return {
            title: d.meta.title || '',
            url: d.url,
            type: parsed.type,
            name: parsed.name
        };
    });

    if (mapped.length === 0) {
        list.innerHTML = '';
        empty.hidden = false;
        empty.textContent = `No results for "${query}"`;
        activeIndex = -1;
        return;
    }

    empty.hidden = true;
    const searchQuery = lastQuery;
    list.innerHTML = mapped
        .map(
            (r, i) =>
                '<a href="' +
                escapeAttr(r.url) +
                '" class="cdx-cp-item' +
                (i === 0 ? ' cdx-cp-active' : '') +
                '"' +
                ' role="option" aria-selected="' +
                (i === 0) +
                '" data-index="' +
                i +
                '" style="--i:' +
                i +
                '">' +
                resultIcon(r.type) +
                '<span class="cdx-cp-name">' +
                highlightMatch(r.name, searchQuery) +
                '</span>' +
                '<span class="' +
                (entityClass(r.type) !== 'other'
                    ? `cdx-badge cdx-badge--entity-${entityClass(r.type)} `
                    : '') +
                'cdx-cp-type">' +
                typeLabel(r.type) +
                '</span>' +
                '</a>'
        )
        .join('');

    activeIndex = 0;
};

/** Escape HTML entities */
const escapeHtml = (s: string): string =>
    s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

/** Escape for HTML attributes */
const escapeAttr = (s: string): string =>
    s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

/** Update active item highlighting */
const updateActive = (newIndex: number) => {
    const list = getList();
    if (!list) {
        return;
    }
    const items = list.querySelectorAll<HTMLElement>('.cdx-cp-item');
    if (items.length === 0) {
        return;
    }

    const clamped = Math.max(0, Math.min(newIndex, items.length - 1));
    items.forEach((item, i) => {
        const isActive = i === clamped;
        item.classList.toggle('cdx-cp-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
    });
    activeIndex = clamped;

    // Scroll active item into view
    items[clamped]?.scrollIntoView({ block: 'nearest' });
};

/** Navigate to the currently active result */
const navigateToActive = () => {
    const list = getList();
    if (!list) {
        return;
    }
    const active = list.querySelector<HTMLAnchorElement>('.cdx-cp-active');
    if (active?.href) {
        close();
        // Use SPA router click simulation
        active.click();
    }
};

/** Open the command palette */
export const openCommandPalette = () => {
    const dialog = getDialog();
    if (!dialog) {
        return;
    }
    dialog.showModal();
    const input = getInput();
    if (input) {
        input.value = '';
        input.focus();
    }
    const list = getList();
    const empty = getEmpty();
    if (list) {
        list.innerHTML = '';
    }
    if (empty) {
        empty.hidden = false;
        empty.textContent = 'Start typing to see results';
    }
    activeIndex = -1;
    lastQuery = '';

    // Lazy-load Pagefind on first open
    loadPagefind();
};

/** Close the command palette */
const close = () => {
    const dialog = getDialog();
    if (!dialog) {
        return;
    }
    dialog.close();
};

export const initCommandPalette = () => {
    const dialog = getDialog();
    if (!dialog) {
        return;
    }

    // Cmd+K / Ctrl+K to open
    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (dialog.open) {
                close();
            } else {
                openCommandPalette();
            }
        }
    });

    // Close on backdrop click
    dialog.addEventListener('click', e => {
        if (e.target === dialog) {
            close();
        }
    });

    // X-button close
    dialog.querySelector('.cdx-cp-close')?.addEventListener('click', () => close());

    // Close on Escape (native dialog behavior, but ensure cleanup)
    dialog.addEventListener('close', () => {
        activeIndex = -1;
        lastQuery = '';
    });

    // Search input handling
    const input = getInput();
    if (input) {
        input.addEventListener('input', () => {
            const q = input.value;
            if (q === lastQuery) {
                return;
            }
            lastQuery = q;

            clearTimeout(throttleTimer);
            throttleTimer = setTimeout(() => search(q), THROTTLE_MS);
        });

        input.addEventListener('keydown', e => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    updateActive(activeIndex + 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    updateActive(activeIndex - 1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    navigateToActive();
                    break;
                case 'Escape':
                    // Let native dialog handle it
                    break;
            }
        });
    }

    // Click on result items
    const list = getList();
    if (list) {
        list.addEventListener('click', e => {
            const item = (e.target as HTMLElement).closest<HTMLAnchorElement>('.cdx-cp-item');
            if (item) {
                e.preventDefault();
                const idx = parseInt(item.dataset.index ?? '0', 10);
                updateActive(idx);
                navigateToActive();
            }
        });

        // Mouse hover updates active state
        list.addEventListener('mousemove', e => {
            const item = (e.target as HTMLElement).closest<HTMLElement>('.cdx-cp-item');
            if (item && item.dataset.index !== undefined) {
                updateActive(parseInt(item.dataset.index, 10));
            }
        });
    }

    // Sidebar search input click opens command palette (legacy)
    document.querySelectorAll('#book-search-input input').forEach(el => {
        el.addEventListener('focus', e => {
            e.preventDefault();
            (el as HTMLInputElement).blur();
            openCommandPalette();
        });
    });

    // Search trigger button in sidebar header
    document.querySelectorAll<HTMLElement>('[data-cdx-search-trigger]').forEach(btn => {
        btn.addEventListener('click', () => openCommandPalette());
    });
};
