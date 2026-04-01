/**
 * SPA-style navigation.
 * Intercepts internal link clicks, fetches pages via fetch(),
 * and swaps the content area without full page reload.
 */

import { initSidebar } from './sidebar';
import { initTabs } from './tabs';
import { initCodeBlocks } from './code-blocks';

const CONTENT_SELECTOR = '.content-data';
const SEARCH_RESULTS_SELECTOR = '.search-results';

/** Re-run page initializers after content swap */
const reinitPage = () => {
    initTabs();
    initCodeBlocks();

    // Re-bind sidebar togglers for any new collapse elements
    initSidebar();

    // Trigger lazy-load check for graphs
    window.dispatchEvent(new Event('scroll'));
};

/** Update sidebar active state */
const updateActiveLink = (url: string) => {
    document.querySelectorAll('.menu a.active').forEach(a => a.classList.remove('active'));

    const filename = url.split('/').pop() || 'index.html';
    document.querySelectorAll<HTMLAnchorElement>('.menu a[data-type]').forEach(a => {
        const href = a.getAttribute('href') || '';
        const hrefFile = href.split('/').pop() || '';
        if (hrefFile.toLowerCase() === filename.toLowerCase()) {
            a.classList.add('active');
        }
    });
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

/** Navigate to a new page via fetch */
const navigate = async (url: string, pushState = true) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            window.location.href = url;
            return;
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Swap content
        const newContent = doc.querySelector(CONTENT_SELECTOR);
        const currentContent = document.querySelector(CONTENT_SELECTOR);
        if (newContent && currentContent) {
            currentContent.innerHTML = newContent.innerHTML;
        }

        // Swap search results area
        const newSearch = doc.querySelector(SEARCH_RESULTS_SELECTOR);
        const currentSearch = document.querySelector(SEARCH_RESULTS_SELECTOR);
        if (newSearch && currentSearch) {
            currentSearch.innerHTML = newSearch.innerHTML;
        }

        // Update page title
        document.title = doc.title;

        // Update globals from inline scripts
        updateGlobals(doc);

        // Update URL
        if (pushState) {
            history.pushState({ path: url }, '', url);
        }

        // Update sidebar active state
        updateActiveLink(url);

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
    // Intercept link clicks
    document.addEventListener('click', (e) => {
        const anchor = (e.target as HTMLElement).closest('a');
        if (!anchor) return;
        if (!isInternalLink(anchor)) return;

        const href = anchor.href;
        if (!href || href === '#') return;

        e.preventDefault();
        navigate(href);
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        navigate(window.location.href, false);
    });
};
