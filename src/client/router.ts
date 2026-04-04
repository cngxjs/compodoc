/**
 * SPA-style navigation.
 * Intercepts internal link clicks, fetches pages via fetch(),
 * and swaps the content area without full page reload.
 */

import { initTabs } from './tabs';
import { initCodeBlocks } from './code-blocks';
import { initGraphs } from './graphs';

const CONTENT_SELECTOR = '.content-data';

/** Strip any existing relative prefix from a path */
const stripPrefix = (path: string): string =>
    path.replace(/^(\.\/|\.\.\/)+/, '');

/** Rewrite relative sidebar links based on current page depth */
const fixMenuLinks = () => {
    const depth = (window as any).COMPODOC_CURRENT_PAGE_DEPTH ?? 0;
    const prefix = depth === 0 ? './' : '../'.repeat(depth);

    document.querySelectorAll<HTMLAnchorElement>('.menu a[data-type]').forEach(a => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('/') || href.startsWith('http')) return;
        a.setAttribute('href', prefix + stripPrefix(href));
    });

    // Fix logo images
    document.querySelectorAll<HTMLImageElement>('.menu img[data-src]').forEach(img => {
        const src = img.getAttribute('data-src');
        if (!src || src.startsWith('/') || src.startsWith('http')) return;
        img.src = prefix + stripPrefix(src);
    });
};

/** Execute script tags found in the content area after SPA swap.
 *  innerHTML doesn't run scripts, so we clone them into live elements.
 *  Returns a promise that resolves when all external scripts have loaded. */
const executeContentScripts = (): Promise<void> => {
    const content = document.querySelector(CONTENT_SELECTOR);
    if (!content) return Promise.resolve();

    const promises: Promise<void>[] = [];
    content.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        if (oldScript.src) {
            const p = new Promise<void>((resolve) => {
                newScript.onload = () => resolve();
                newScript.onerror = () => resolve();
            });
            promises.push(p);
            newScript.src = oldScript.src;
        } else {
            newScript.textContent = oldScript.textContent;
        }
        oldScript.replaceWith(newScript);
    });

    return Promise.all(promises).then(() => {});
};

/** Re-run page initializers after content swap */
const reinitPage = async () => {
    await executeContentScripts();
    initTabs();
    initCodeBlocks();
    initGraphs();
};

/** Update sidebar active state */
const updateActiveLink = (url: string, clickedAnchor: HTMLAnchorElement | null = null) => {
    document.querySelectorAll('.menu a.active').forEach(a => {
        a.classList.remove('active');
        a.removeAttribute('aria-current');
    });

    // If we know exactly which sidebar link was clicked, use it directly
    if (clickedAnchor?.closest('.menu')) {
        clickedAnchor.classList.add('active');
        clickedAnchor.setAttribute('aria-current', 'page');
        return;
    }

    const pathname = new URL(url, window.location.origin).pathname;
    // Normalize: "/" -> "index.html", "/components/Foo.html" -> "components/Foo.html"
    let normalizedPath = pathname.replace(/^\//, '').toLowerCase();
    if (normalizedPath === '' || normalizedPath.endsWith('/')) {
        normalizedPath += 'index.html';
    }

    let bestMatch: HTMLAnchorElement | null = null;
    let bestScore = -1;

    document.querySelectorAll<HTMLAnchorElement>('.menu a[data-type]').forEach(a => {
        const href = a.getAttribute('href') || '';
        const cleaned = href.replace(/^(\.\/|\.\.\/)+/, '').toLowerCase();

        if (normalizedPath.endsWith(cleaned)) {
            // Prefer entity-link (3) > chapter-link (2) > index-link (1)
            const type = a.getAttribute('data-type');
            const score = type === 'entity-link' ? 3 : type === 'chapter-link' ? 2 : 1;
            if (score > bestScore) {
                bestScore = score;
                bestMatch = a;
            }
        }
    });

    if (bestMatch) {
        (bestMatch as HTMLAnchorElement).classList.add('active');
        (bestMatch as HTMLAnchorElement).setAttribute('aria-current', 'page');
    }
};

/** Update page globals that templates depend on */
const updateGlobals = (doc: Document) => {
    const scripts = doc.querySelectorAll('script:not([src])');
    scripts.forEach(script => {
        const text = script.textContent || '';
        const depthMatch = text.match(/COMPODOC_CURRENT_PAGE_DEPTH\s*=\s*(\d+)/);
        const contextMatch = text.match(/COMPODOC_CURRENT_PAGE_CONTEXT\s*=\s*'([^']*)'/);
        const urlMatch = text.match(/COMPODOC_CURRENT_PAGE_URL\s*=\s*'([^']*)'/);
        const maxSearchMatch = text.match(/MAX_SEARCH_RESULTS\s*=\s*(\d+)/);

        if (depthMatch) (window as any).COMPODOC_CURRENT_PAGE_DEPTH = parseInt(depthMatch[1], 10);
        if (contextMatch) (window as any).COMPODOC_CURRENT_PAGE_CONTEXT = contextMatch[1];
        if (urlMatch) (window as any).COMPODOC_CURRENT_PAGE_URL = urlMatch[1];
        if (maxSearchMatch) (window as any).MAX_SEARCH_RESULTS = parseInt(maxSearchMatch[1], 10);
    });
};

/** Send navigation event to parent frame (Template Playground) */
const notifyParentFrame = () => {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'compodoc-iframe-navigate',
            url: window.location.pathname + window.location.hash
        }, '*');
    }
};

/** Check if a URL is internal (same origin, not a hash-only link) */
const isInternalLink = (anchor: HTMLAnchorElement): boolean => {
    if (anchor.target === '_blank') return false;
    if (anchor.hasAttribute('download')) return false;
    if (anchor.origin !== window.location.origin) return false;
    // Allow hash-only links to work normally
    if (anchor.pathname === window.location.pathname && anchor.hash) return false;
    return true;
};

/** Progress bar helpers */
const progressBar = () => document.querySelector<HTMLElement>('.cdx-progress-bar');

const showProgress = () => {
    const bar = progressBar();
    if (!bar) return;
    bar.className = 'cdx-progress-bar cdx-progress--loading';
};

const completeProgress = () => {
    const bar = progressBar();
    if (!bar) return;
    bar.className = 'cdx-progress-bar cdx-progress--done';
    setTimeout(() => {
        bar.classList.add('cdx-progress--hide');
        setTimeout(() => { bar.className = 'cdx-progress-bar'; }, 200);
    }, 300);
};

/** Navigate to a new page via fetch */
const navigate = async (url: string, pushState = true, clickedAnchor: HTMLAnchorElement | null = null) => {
    try {
        showProgress();

        const response = await fetch(url);
        if (!response.ok) {
            completeProgress();
            window.location.href = url;
            return;
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Swap content area (including the wrapper's context class)
        const newContentWrapper = doc.querySelector('.content');
        const currentContentWrapper = document.querySelector('.content');
        if (newContentWrapper && currentContentWrapper) {
            currentContentWrapper.className = newContentWrapper.className;
        }
        const newContent = doc.querySelector(CONTENT_SELECTOR);
        const currentContent = document.querySelector(CONTENT_SELECTOR);
        if (newContent && currentContent) {
            currentContent.innerHTML = newContent.innerHTML;
            // Trigger content fade animation
            currentContent.classList.remove('cdx-fade-in');
            void (currentContent as HTMLElement).offsetWidth; // force reflow
            currentContent.classList.add('cdx-fade-in');
        }

        completeProgress();

        // Sidebar is NOT swapped -- menu structure is identical across pages.
        // Only link prefixes and active state need updating.

        // Update page title
        document.title = doc.title;

        // Update globals from inline scripts
        updateGlobals(doc);

        // Update URL
        if (pushState) {
            history.pushState({ path: url }, '', url);
        }

        // Fix sidebar links for new page depth and update active state
        fixMenuLinks();
        updateActiveLink(url, clickedAnchor);

        // Scroll to top or to anchor
        const hash = new URL(url, window.location.origin).hash;
        if (hash) {
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView();
            }
        } else {
            document.querySelector('.content')?.scrollTo(0, 0);
        }

        // Re-initialize page components
        reinitPage();

        // Notify parent frame
        notifyParentFrame();

    } catch {
        // Fallback to full page load on error
        window.location.href = url;
    }
};

export const initRouter = () => {
    // Fix sidebar links and set active link on initial page load
    fixMenuLinks();
    updateActiveLink(window.location.href);

    // Intercept link clicks
    document.addEventListener('click', (e) => {
        const anchor = (e.target as HTMLElement).closest('a');
        if (!anchor) return;
        if (!isInternalLink(anchor)) return;

        const href = anchor.href;
        if (!href || href === '#') return;

        e.preventDefault();
        // If clicked link is in sidebar, pass it as the active hint
        const sidebarAnchor = anchor.closest('.menu') ? anchor : null;
        navigate(href, true, sidebarAnchor as HTMLAnchorElement | null);
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        navigate(window.location.href, false);
    });
};
