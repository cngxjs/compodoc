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

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const flashLine = (el: Element) => {
    el.classList.add('cdx-line-highlight');
    if (!prefersReducedMotion()) {
        el.classList.add('cdx-line-flash');
        el.addEventListener(
            'animationend',
            () => {
                el.classList.remove('cdx-line-flash');
            },
            { once: true }
        );
    }
};

const clearHighlights = (container: Element) => {
    container.querySelectorAll('.cdx-line-highlight').forEach(el => {
        el.classList.remove('cdx-line-highlight', 'cdx-line-flash');
    });
};

const highlightLines = (container: Element, start: number, end: number) => {
    clearHighlights(container);
    const lines = container.querySelectorAll<HTMLElement>('.line[data-cdx-line-nr]');
    let firstMatch: HTMLElement | null = null;

    lines.forEach(line => {
        const nr = parseInt(line.dataset.cdxLineNr || '0', 10);
        if (nr >= start && nr <= end) {
            line.classList.add('cdx-line-highlight');
            if (!firstMatch) {
                firstMatch = line;
            }
        }
    });

    if (firstMatch) {
        const behavior = prefersReducedMotion() ? ('auto' as const) : ('smooth' as const);
        firstMatch.scrollIntoView({ behavior, block: 'center' });
        if (start === end) {
            flashLine(firstMatch);
        }
    }
};

const parseLineHash = (hash: string): { start: number; end: number } | null => {
    const match = hash.match(/^#L(\d+)(?:-L(\d+))?$/);
    if (!match) {
        return null;
    }
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

const initCopyButtons = () => {
    document.querySelectorAll<HTMLElement>('pre:has(> code), pre.shiki').forEach(pre => {
        if (!pre.hasAttribute('role')) {
            pre.setAttribute('tabindex', '0');
            pre.setAttribute('role', 'region');
            pre.setAttribute('aria-label', 'Source code');
        }
        pre.querySelectorAll('.cdx-line-number, .line-number, .line-numbers-rows span').forEach(
            el => {
                el.setAttribute('aria-hidden', 'true');
            }
        );

        if (pre.querySelector('.cdx-code-copy')) {
            return;
        }

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

const initLinkToSource = () => {
    document.querySelectorAll<HTMLAnchorElement>('.cdx-link-to-source').forEach(link => {
        if (link.dataset.cdxBound) {
            return;
        }
        link.dataset.cdxBound = '1';

        link.addEventListener('click', e => {
            e.preventDefault();
            const targetLine = link.getAttribute('data-cdx-line');
            const sourceTab = document.querySelector<HTMLElement>('#source-tab');
            if (sourceTab) {
                sourceTab.click();
            }

            if (targetLine) {
                const lineNr = parseInt(targetLine, 10);
                history.replaceState(null, '', `#L${lineNr}`);

                setTimeout(() => {
                    const pre = document.querySelector('.cdx-source-code pre');
                    if (!pre) {
                        return;
                    }
                    highlightLines(pre, lineNr, lineNr);
                }, 300);
            }
        });
    });
};

const initLinePermalinks = () => {
    document.querySelectorAll<HTMLElement>('.cdx-source-code pre').forEach(pre => {
        if (pre.dataset.cdxPermalinks) {
            return;
        }
        pre.dataset.cdxPermalinks = '1';

        let rangeStart: number | null = null;

        pre.addEventListener('click', e => {
            const target = e.target as HTMLElement;
            if (!target.classList.contains('cdx-line-number')) {
                return;
            }

            const lineNr = parseInt(target.dataset.cdxLineNr || '0', 10);
            if (!lineNr) {
                return;
            }

            if (e.shiftKey && rangeStart !== null) {
                const start = Math.min(rangeStart, lineNr);
                const end = Math.max(rangeStart, lineNr);
                history.replaceState(null, '', `#L${start}-L${end}`);
                highlightLines(pre, start, end);
            } else {
                rangeStart = lineNr;
                history.replaceState(null, '', `#L${lineNr}`);
                highlightLines(pre, lineNr, lineNr);
            }
        });
    });
};

const initHashHighlight = () => {
    const applyHash = () => {
        const range = parseLineHash(location.hash);
        if (!range) {
            return;
        }

        const sourceTab = document.querySelector<HTMLElement>('#source-tab');
        if (sourceTab && !sourceTab.classList.contains('active')) {
            sourceTab.click();
        }

        // wait for tab switch animation
        setTimeout(() => {
            const pre = document.querySelector('.cdx-source-code pre');
            if (pre) {
                highlightLines(pre, range.start, range.end);
            }
        }, 100);
    };

    applyHash();
    window.addEventListener('hashchange', applyHash);
};

const initSourceBreadcrumb = () => {
    document.querySelectorAll<HTMLElement>('.cdx-source-code').forEach(container => {
        const pre = container.querySelector('pre');
        if (!pre) {
            return;
        }

        if (container.querySelector('.cdx-source-breadcrumb')) {
            return;
        }

        const memberLines = pre.querySelectorAll<HTMLElement>('[data-cdx-member]');
        if (memberLines.length === 0) {
            return;
        }

        const bar = document.createElement('div');
        bar.className = 'cdx-source-breadcrumb';
        bar.setAttribute('aria-live', 'polite');
        bar.setAttribute('aria-label', 'Current scope');
        container.insertBefore(bar, pre);

        const memberEntries: Array<{ el: HTMLElement; name: string; kind: string }> = [];
        memberLines.forEach(el => {
            memberEntries.push({
                el,
                name: el.dataset.cdxMember || '',
                kind: el.dataset.cdxMemberKind || ''
            });
        });

        let currentScope = '';

        const updateBreadcrumb = (name: string) => {
            if (name === currentScope) {
                return;
            }
            currentScope = name;

            const parts = name.split('.');
            bar.innerHTML = parts
                .map((part, i) => {
                    const isLast = i === parts.length - 1;
                    const fullName = parts.slice(0, i + 1).join('.');
                    const segment = `<span class="cdx-breadcrumb-segment" data-cdx-member-ref="${escapeAttr(fullName)}">${escapeHtmlClient(part)}</span>`;
                    return isLast
                        ? segment
                        : `${segment}<span class="cdx-breadcrumb-sep">&rsaquo;</span>`;
                })
                .join('');

            bar.querySelectorAll<HTMLElement>('.cdx-breadcrumb-segment').forEach(seg => {
                seg.addEventListener('click', () => {
                    const ref = seg.dataset.cdxMemberRef || '';
                    const memberName = ref.split('.').pop() || '';
                    const infoTab = document.querySelector('#info');
                    if (infoTab) {
                        const _header = infoTab.querySelector(
                            `[id*="${memberName}"], .cdx-member-name`
                        ) as HTMLElement;
                        const allHeaders =
                            infoTab.querySelectorAll<HTMLElement>('.cdx-member-name');
                        for (const h of allHeaders) {
                            if (h.textContent?.trim().includes(memberName)) {
                                const infoTabBtn = document.querySelector<HTMLElement>('#info-tab');
                                if (infoTabBtn) {
                                    infoTabBtn.click();
                                }
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

        const observer = new IntersectionObserver(
            entries => {
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
                rootMargin: '-10% 0px -80% 0px',
                threshold: 0
            }
        );

        memberEntries.forEach(({ el }) => observer.observe(el));
    });
};

const escapeHtmlClient = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeAttr = (str: string) => str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const initLanguageChips = () => {
    document.querySelectorAll<HTMLElement>('pre:has(> code), pre.shiki').forEach(pre => {
        if (pre.querySelector('.cdx-code-lang-chip') || pre.closest('.cdx-source-code')) {
            return;
        }

        const code = pre.querySelector('code');
        if (!code) {
            return;
        }

        const langClass = Array.from(code.classList).find(c => c.startsWith('language-'));
        if (!langClass) {
            return;
        }

        const lang = langClass.replace('language-', '');
        const label = LANG_MAP[lang] || lang.toUpperCase();

        const chip = document.createElement('span');
        chip.className = 'cdx-code-lang-chip';
        chip.textContent = label;
        pre.style.position = 'relative';
        pre.appendChild(chip);
    });
};

const initExpandableSnippets = () => {
    document.querySelectorAll<HTMLElement>('pre:has(> code), pre.shiki').forEach(pre => {
        if (pre.closest('.cdx-source-code') || pre.dataset.cdxExpandChecked) {
            return;
        }
        pre.dataset.cdxExpandChecked = '1';

        const code = pre.querySelector('code');
        if (!code) {
            return;
        }

        const lineCount = (code.textContent || '').split('\n').length;
        if (lineCount <= 10) {
            return;
        }

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
