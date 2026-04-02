/**
 * Command palette (Cmd+K / Ctrl+K).
 * Pagefind-powered search with entity type badges and keyboard navigation.
 */

const DIALOG_ID = 'cdx-command-palette';
const INPUT_SELECTOR = '.cdx-cp-input';
const LIST_SELECTOR = '.cdx-cp-results';
const EMPTY_SELECTOR = '.cdx-cp-empty';
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

/** Parse entity type from Pagefind result title */
const parseEntityType = (title: string): { type: EntityType | 'other'; name: string } => {
    const lower = title.toLowerCase();
    for (const t of ENTITY_TYPES) {
        // Pagefind titles follow pattern: "type - EntityName" or "type - EntityName - ModuleName"
        if (lower.startsWith(t + ' - ') || lower.startsWith(t + 's - ')) {
            const name = title.substring(title.indexOf(' - ') + 3);
            return { type: t, name };
        }
    }
    return { type: 'other', name: title };
};

/** Capitalize first letter */
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

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

/** Load Pagefind lazily */
const loadPagefind = async (): Promise<any> => {
    if (pagefind) return pagefind;
    if (window.location.protocol === 'file:') return null;

    const depth = (window as any).COMPODOC_CURRENT_PAGE_DEPTH ?? 0;
    const prefix = depth === 0 ? './' : '../'.repeat(depth);

    try {
        pagefind = await import(/* @vite-ignore */ prefix + 'pagefind/pagefind.js');
        await pagefind.init();
        return pagefind;
    } catch (e) {
        console.warn('Search unavailable:', (e as Error).message);
        return null;
    }
};

/** Perform search and render results */
const search = async (query: string) => {
    const list = getList();
    const empty = getEmpty();
    if (!list || !empty) return;

    if (!query.trim()) {
        list.innerHTML = '';
        empty.hidden = true;
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
    list.innerHTML = mapped
        .map(
            (r, i) => `
        <a href="${escapeAttr(r.url)}" class="cdx-cp-item${i === 0 ? ' cdx-cp-active' : ''}"
           role="option" aria-selected="${i === 0}" data-index="${i}">
            <span class="cdx-cp-badge cdx-cp-badge--${entityClass(r.type)}">${cap(r.type === 'other' ? 'page' : r.type)}</span>
            <span class="cdx-cp-name">${escapeHtml(r.name)}</span>
        </a>
    `
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
    if (!list) return;
    const items = list.querySelectorAll<HTMLElement>('.cdx-cp-item');
    if (items.length === 0) return;

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
    if (!list) return;
    const active = list.querySelector<HTMLAnchorElement>('.cdx-cp-active');
    if (active?.href) {
        close();
        // Use SPA router click simulation
        active.click();
    }
};

/** Open the command palette */
const open = () => {
    const dialog = getDialog();
    if (!dialog) return;
    dialog.showModal();
    const input = getInput();
    if (input) {
        input.value = '';
        input.focus();
    }
    const list = getList();
    const empty = getEmpty();
    if (list) list.innerHTML = '';
    if (empty) empty.hidden = true;
    activeIndex = -1;
    lastQuery = '';
};

/** Close the command palette */
const close = () => {
    const dialog = getDialog();
    if (!dialog) return;
    dialog.close();
};

export const initCommandPalette = () => {
    const dialog = getDialog();
    if (!dialog) return;

    // Cmd+K / Ctrl+K to open
    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (dialog.open) {
                close();
            } else {
                open();
            }
        }
    });

    // Close on backdrop click
    dialog.addEventListener('click', e => {
        if (e.target === dialog) {
            close();
        }
    });

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
            if (q === lastQuery) return;
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

    // Sidebar search input click opens command palette
    document.querySelectorAll('#book-search-input input').forEach(el => {
        el.addEventListener('focus', e => {
            e.preventDefault();
            (el as HTMLInputElement).blur();
            open();
        });
    });
};
