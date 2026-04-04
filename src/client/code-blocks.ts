/**
 * Code block copy button and line navigation.
 * Copy button with checkmark animation.
 */

export const initCodeBlocks = () => {
    // Add a11y attributes and copy buttons to all code blocks
    document.querySelectorAll<HTMLElement>('.compodoc-sourcecode pre').forEach(pre => {
        // A11y: make code blocks focusable and labelled
        if (!pre.hasAttribute('role')) {
            pre.setAttribute('tabindex', '0');
            pre.setAttribute('role', 'region');
            pre.setAttribute('aria-label', 'Source code');
        }
        // Hide line numbers from screen readers
        pre.querySelectorAll('.line-number, .line-numbers-rows span').forEach(el => {
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

        // Detect horizontal overflow for gradient indicator
        if (pre.scrollWidth > pre.clientWidth) {
            pre.classList.add('cdx-overflow');
        }
    });

    // Link-to-source line navigation
    document.querySelectorAll<HTMLAnchorElement>('.link-to-prism').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetLine = link.getAttribute('data-line');
            const sourceTab = document.querySelector<HTMLElement>('#source-tab');
            if (sourceTab) sourceTab.click();

            if (targetLine) {
                setTimeout(() => {
                    const pre = document.querySelector('.compodoc-sourcecode pre');
                    if (!pre) return;
                    const lines = pre.querySelectorAll('.line');
                    const idx = parseInt(targetLine, 10) - 1;
                    if (lines[idx]) {
                        lines[idx].scrollIntoView({ block: 'center' });
                    }
                }, 300);
            }
        });
    });
};
