/**
 * Code block enhancements: copy button, link-to-source navigation,
 * line permalinks, language chips, and expandable snippets.
 */

const LANG_MAP: Record<string, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    json: 'JSON',
    bash: 'Shell',
    markdown: 'Markdown'
};

const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Flash a line element briefly to draw attention after navigation. */
const flashLine = (el: Element) => {
    el.classList.add('cdx-line-highlight');
    if (!prefersReducedMotion()) {
        el.classList.add('cdx-line-flash');
        el.addEventListener('animationend', () => {
            el.classList.remove('cdx-line-flash');
        }, { once: true });
    }
};

/** Clear all line highlights in a container. */
const clearHighlights = (container: Element) => {
    container.querySelectorAll('.cdx-line-highlight').forEach(el => {
        el.classList.remove('cdx-line-highlight', 'cdx-line-flash');
    });
};

/**
 * Highlight a range of lines [start, end] inclusive.
 * Scrolls the first line into view.
 */
const highlightLines = (container: Element, start: number, end: number) => {
    clearHighlights(container);
    const lines = container.querySelectorAll<HTMLElement>('.line[data-cdx-line-nr]');
    let firstMatch: HTMLElement | null = null;

    lines.forEach(line => {
        const nr = parseInt(line.dataset.cdxLineNr || '0', 10);
        if (nr >= start && nr <= end) {
            line.classList.add('cdx-line-highlight');
            if (!firstMatch) firstMatch = line;
        }
    });

    if (firstMatch) {
        const behavior = prefersReducedMotion() ? 'auto' as const : 'smooth' as const;
        firstMatch.scrollIntoView({ behavior, block: 'center' });
        if (start === end) flashLine(firstMatch);
    }
};

/**
 * Parse a line hash like #L42 or #L10-L25.
 * Returns null if not a valid line hash.
 */
const parseLineHash = (hash: string): { start: number; end: number } | null => {
    const match = hash.match(/^#L(\d+)(?:-L(\d+))?$/);
    if (!match) return null;
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;
    return { start: Math.min(start, end), end: Math.max(start, end) };
};

export const initCodeBlocks = () => {
    initCopyButtons();
    initLinkToSource();
    initLinePermalinks();
    initHashHighlight();
    initSourceBreadcrumb();
    initLanguageChips();
    initExpandableSnippets();
};

/** Add a11y attributes and copy buttons to all code blocks. */
const initCopyButtons = () => {
    document.querySelectorAll<HTMLElement>('pre:has(> code), pre.shiki').forEach(pre => {
        // A11y: make code blocks focusable and labelled
        if (!pre.hasAttribute('role')) {
            pre.setAttribute('tabindex', '0');
            pre.setAttribute('role', 'region');
            pre.setAttribute('aria-label', 'Source code');
        }
        // Hide line numbers from screen readers
        pre.querySelectorAll('.cdx-line-number, .line-number, .line-numbers-rows span').forEach(el => {
            el.setAttribute('aria-hidden', 'true');
        });

        // Skip if already has a copy button
        if (pre.querySelector('.cdx-code-copy')) return;

        const btn = document.createElement('button');
        btn.className = 'cdx-code-copy';
        btn.textContent = 'Copy';
        btn.setAttribute('aria-label', 'Copy code');
        btn.addEventListener('click', () => {
            const code = pre.querySelector('code');
            if (code) {
                navigator.clipboard.writeText(code.textContent || '').then(() => {
                    btn.textContent = 'Copied!';
                    btn.setAttribute('aria-label', 'Copied!');
                    btn.classList.add('cdx-code-copy--copied');
                    setTimeout(() => {
                        btn.textContent = 'Copy';
                        btn.setAttribute('aria-label', 'Copy code');
                        btn.classList.remove('cdx-code-copy--copied');
                    }, 2000);
                });
            }
        });
        pre.style.position = 'relative';
        pre.appendChild(btn);
    });
};

/** Link-to-source: click "defined in" links to scroll to line in Source tab. */
const initLinkToSource = () => {
    document.querySelectorAll<HTMLAnchorElement>('.cdx-link-to-source').forEach(link => {
        // Skip if already wired
        if (link.dataset.cdxBound) return;
        link.dataset.cdxBound = '1';

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetLine = link.getAttribute('data-cdx-line');
            const sourceTab = document.querySelector<HTMLElement>('#source-tab');
            if (sourceTab) sourceTab.click();

            if (targetLine) {
                const lineNr = parseInt(targetLine, 10);
                // Update URL hash for permalink
                history.replaceState(null, '', `#L${lineNr}`);

                setTimeout(() => {
                    const pre = document.querySelector('.compodoc-sourcecode pre');
                    if (!pre) return;
                    highlightLines(pre, lineNr, lineNr);
                }, 300);
            }
        });
    });
};

/** Wire clickable line numbers for permalink navigation. */
const initLinePermalinks = () => {
    document.querySelectorAll<HTMLElement>('.compodoc-sourcecode pre').forEach(pre => {
        // Skip if already wired
        if (pre.dataset.cdxPermalinks) return;
        pre.dataset.cdxPermalinks = '1';

        let rangeStart: number | null = null;

        pre.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!target.classList.contains('cdx-line-number')) return;

            const lineNr = parseInt(target.dataset.cdxLineNr || '0', 10);
            if (!lineNr) return;

            if (e.shiftKey && rangeStart !== null) {
                // Shift+click: select range
                const start = Math.min(rangeStart, lineNr);
                const end = Math.max(rangeStart, lineNr);
                history.replaceState(null, '', `#L${start}-L${end}`);
                highlightLines(pre, start, end);
            } else {
                // Single click: select one line
                rangeStart = lineNr;
                history.replaceState(null, '', `#L${lineNr}`);
                highlightLines(pre, lineNr, lineNr);
            }
        });
    });
};

/**
 * On page load / hash change, highlight lines referenced in the URL hash.
 * Handles both initial load and SPA navigation.
 */
const initHashHighlight = () => {
    const applyHash = () => {
        const range = parseLineHash(location.hash);
        if (!range) return;

        // If source tab exists but isn't active, switch to it first
        const sourceTab = document.querySelector<HTMLElement>('#source-tab');
        if (sourceTab && !sourceTab.classList.contains('active')) {
            sourceTab.click();
        }

        // Small delay to allow tab switch animation
        setTimeout(() => {
            const pre = document.querySelector('.compodoc-sourcecode pre');
            if (pre) highlightLines(pre, range.start, range.end);
        }, 100);
    };

    // Apply on init
    applyHash();

    // Listen for hash changes (back/forward navigation)
    window.addEventListener('hashchange', applyHash);
};

/**
 * Source breadcrumb bar: tracks scroll position in the source viewer
 * and shows the current class/member scope.
 */
const initSourceBreadcrumb = () => {
    document.querySelectorAll<HTMLElement>('.compodoc-sourcecode').forEach(container => {
        const pre = container.querySelector('pre');
        if (!pre) return;

        // Skip if already has a breadcrumb
        if (container.querySelector('.cdx-source-breadcrumb')) return;

        // Collect member markers from the rendered lines
        const memberLines = pre.querySelectorAll<HTMLElement>('[data-cdx-member]');
        if (memberLines.length === 0) return;

        // Create breadcrumb bar
        const bar = document.createElement('div');
        bar.className = 'cdx-source-breadcrumb';
        bar.setAttribute('aria-live', 'polite');
        bar.setAttribute('aria-label', 'Current scope');
        container.insertBefore(bar, pre);

        // Build ordered member list for intersection tracking
        const memberEntries: Array<{ el: HTMLElement; name: string; kind: string }> = [];
        memberLines.forEach(el => {
            memberEntries.push({
                el,
                name: el.dataset.cdxMember || '',
                kind: el.dataset.cdxMemberKind || ''
            });
        });

        // Track which members are visible
        let currentScope = '';

        const updateBreadcrumb = (name: string) => {
            if (name === currentScope) return;
            currentScope = name;

            const parts = name.split('.');
            bar.innerHTML = parts.map((part, i) => {
                const isLast = i === parts.length - 1;
                const fullName = parts.slice(0, i + 1).join('.');
                const segment = `<span class="cdx-breadcrumb-segment" data-cdx-member-ref="${escapeAttr(fullName)}">${escapeHtmlClient(part)}</span>`;
                return isLast ? segment : segment + '<span class="cdx-breadcrumb-sep">&rsaquo;</span>';
            }).join('');

            // Wire click handlers for breadcrumb segments
            bar.querySelectorAll<HTMLElement>('.cdx-breadcrumb-segment').forEach(seg => {
                seg.addEventListener('click', () => {
                    const ref = seg.dataset.cdxMemberRef || '';
                    // Try to find the member in the Info tab and scroll to it
                    const memberName = ref.split('.').pop() || '';
                    const infoTab = document.querySelector('#info');
                    if (infoTab) {
                        // Try header ID first, then search by text
                        const header = infoTab.querySelector(`[id*="${memberName}"], .cdx-member-name`) as HTMLElement;
                        const allHeaders = infoTab.querySelectorAll<HTMLElement>('.cdx-member-name');
                        for (const h of allHeaders) {
                            if (h.textContent?.trim().includes(memberName)) {
                                // Switch to info tab if not active
                                const infoTabBtn = document.querySelector<HTMLElement>('#info-tab');
                                if (infoTabBtn) infoTabBtn.click();
                                setTimeout(() => {
                                    h.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 100);
                                return;
                            }
                        }
                    }
                });
            });
        };

        // Use IntersectionObserver to track which member is in view
        const observer = new IntersectionObserver(
            (entries) => {
                // Find the topmost visible member
                let topVisible: { name: string; top: number } | null = null;

                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const el = entry.target as HTMLElement;
                        const name = el.dataset.cdxMember || '';
                        const top = entry.boundingClientRect.top;
                        if (!topVisible || top < topVisible.top) {
                            topVisible = { name, top };
                        }
                    }
                }

                if (topVisible) {
                    updateBreadcrumb(topVisible.name);
                }
            },
            {
                root: container,
                rootMargin: '-10% 0px -80% 0px', // Bias toward top of viewport
                threshold: 0
            }
        );

        memberEntries.forEach(({ el }) => observer.observe(el));
    });
};

const escapeHtmlClient = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttr = (str: string) =>
    str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Add language label chips to snippet code blocks (non-source-viewer). */
const initLanguageChips = () => {
    document.querySelectorAll<HTMLElement>('pre:has(> code), pre.shiki').forEach(pre => {
        // Skip source viewer blocks (they have their own header) and already-processed
        if (pre.querySelector('.cdx-code-lang-chip') || pre.closest('.compodoc-sourcecode')) return;

        const code = pre.querySelector('code');
        if (!code) return;

        // Detect language from class (language-xxx or shiki lang-xxx)
        const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
        if (!langClass) return;

        const lang = langClass.replace('language-', '');
        const label = LANG_MAP[lang] || lang.toUpperCase();

        const chip = document.createElement('span');
        chip.className = 'cdx-code-lang-chip';
        chip.textContent = label;
        pre.style.position = 'relative';
        pre.appendChild(chip);
    });
};

/** Collapse long snippet blocks (>10 lines) with "Show more" button. */
const initExpandableSnippets = () => {
    document.querySelectorAll<HTMLElement>('pre:has(> code), pre.shiki').forEach(pre => {
        // Skip source viewer blocks and already-processed blocks
        if (pre.closest('.compodoc-sourcecode') || pre.dataset.cdxExpandChecked) return;
        pre.dataset.cdxExpandChecked = '1';

        const code = pre.querySelector('code');
        if (!code) return;

        const lineCount = (code.textContent || '').split('\n').length;
        if (lineCount <= 10) return;

        // Wrap in expandable container
        const wrapper = document.createElement('div');
        wrapper.className = 'cdx-code-expandable';
        pre.parentNode?.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const btn = document.createElement('button');
        btn.className = 'cdx-code-expand-btn';
        btn.textContent = `Show all ${lineCount} lines`;
        btn.setAttribute('aria-label', `Expand code block to show all ${lineCount} lines`);
        btn.addEventListener('click', () => {
            wrapper.classList.add('cdx-code-expanded');
        });
        wrapper.appendChild(btn);
    });
};
