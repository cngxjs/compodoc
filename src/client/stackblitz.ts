/**
 * Stackblitz integration — opens StackBlitz projects in new tabs.
 * Handles elements with [data-stackblitz-url] attribute and .cdx-stackblitz-tag buttons.
 * No SDK dependency — uses direct URL opening for simplicity and zero bundle impact.
 */

function createOpenButton(url: string, container: Element): void {
    const btn = document.createElement('a');
    btn.className = 'cdx-stackblitz-btn';
    btn.textContent = 'Open in StackBlitz';
    btn.href = url.startsWith('http') ? url : `https://stackblitz.com/edit/${url}`;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    container.appendChild(btn);
}

export function initStackblitz(): void {
    // Handle [data-stackblitz-url] elements
    const elements = document.querySelectorAll<HTMLElement>('[data-stackblitz-url]');
    elements.forEach(el => {
        const url = el.dataset.stackblitzUrl;
        if (url) {
            createOpenButton(url, el);
        }
    });

    // Handle @stackblitz JSDoc tag link buttons
    const tagButtons = document.querySelectorAll<HTMLElement>('.cdx-stackblitz-tag');
    tagButtons.forEach(el => {
        const url = el.dataset.url;
        if (url) {
            el.addEventListener('click', () => {
                window.open(
                    url.startsWith('http') ? url : `https://stackblitz.com/edit/${url}`,
                    '_blank',
                    'noopener,noreferrer'
                );
            });
        }
    });
}
