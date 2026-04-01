/**
 * Code block copy button and line navigation.
 * Replaces sourceCode.js + clipboard.min.js.
 */

export const initCodeBlocks = () => {
    // Add copy buttons to all code blocks
    document.querySelectorAll<HTMLElement>('.compodoc-sourcecode pre').forEach(pre => {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = 'Copy';
        btn.addEventListener('click', () => {
            const code = pre.querySelector('code');
            if (code) {
                navigator.clipboard.writeText(code.textContent || '').then(() => {
                    btn.textContent = 'Copied!';
                    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
                });
            }
        });
        pre.style.position = 'relative';
        pre.appendChild(btn);
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
