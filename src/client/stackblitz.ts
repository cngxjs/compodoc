/**
 * StackBlitz integration. Two surfaces:
 *
 * 1. Author-supplied @stackblitz JSDoc tag links (legacy) — open the linked
 *    project in a new tab via `window.open` with no SDK loaded.
 * 2. `@playground` blocks — click on a `.cdx-playground-launch` button
 *    materializes the SDK lazily via dynamic `import('@stackblitz/sdk')`
 *    and calls `openProject(manifest, { newWindow: true })`. Static doc
 *    pages do not pay the SDK byte cost until the user opts in.
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

async function launchPlayground(buttonEl: HTMLButtonElement): Promise<void> {
    const manifestId = buttonEl.dataset.cdxStackblitzManifest;
    if (!manifestId) {
        return;
    }
    const manifestNode = document.querySelector<HTMLScriptElement>(
        `script[data-cdx-stackblitz-manifest-data="${manifestId}"]`
    );
    if (!manifestNode) {
        console.error('[compodocx] missing playground manifest:', manifestId);
        return;
    }
    let manifest: unknown;
    try {
        manifest = JSON.parse(manifestNode.textContent ?? '{}');
    } catch (err) {
        console.error('[compodocx] could not parse playground manifest:', err);
        return;
    }
    try {
        const mod = await import('@stackblitz/sdk');
        const sdk = (mod as any).default ?? mod;
        sdk.openProject(manifest, { newWindow: true });
    } catch (err) {
        console.error('[compodocx] StackBlitz SDK failed to load:', err);
    }
}

function initPlaygroundLaunchers(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.cdx-playground-launch');
    if (buttons.length === 0) {
        return;
    }
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            launchPlayground(btn);
        });
    });
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

    initPlaygroundLaunchers();
}
