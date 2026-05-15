const BOUND = new WeakSet<HTMLIFrameElement>();

const measureContentHeight = (doc: Document): number => {
    const body = doc.body;
    if (body) {
        const rect = body.getBoundingClientRect();
        const styles = doc.defaultView?.getComputedStyle(body);
        const marginTop = styles ? parseFloat(styles.marginTop) || 0 : 0;
        const marginBottom = styles ? parseFloat(styles.marginBottom) || 0 : 0;
        return Math.ceil(rect.height + marginTop + marginBottom);
    }
    return doc.documentElement?.scrollHeight ?? 0;
};

const resizeIframe = (iframe: HTMLIFrameElement): void => {
    try {
        const doc = iframe.contentDocument;
        if (!doc) {
            return;
        }
        const height = measureContentHeight(doc);
        if (height > 0) {
            iframe.style.height = `${height}px`;
        }
    } catch {
        // cross-origin — keep CSS min-height fallback
    }
};

const observeContent = (iframe: HTMLIFrameElement): void => {
    try {
        const doc = iframe.contentDocument;
        if (!doc) {
            return;
        }
        const target = doc.body ?? doc.documentElement;
        if (!target) {
            return;
        }
        const ro = new ResizeObserver(() => resizeIframe(iframe));
        ro.observe(target);
    } catch {
        // cross-origin — silent
    }
};

const bind = (iframe: HTMLIFrameElement): void => {
    if (BOUND.has(iframe)) {
        return;
    }
    BOUND.add(iframe);

    iframe.addEventListener('load', () => {
        resizeIframe(iframe);
        observeContent(iframe);
    });

    // Already-loaded iframes (cached / SPA-restored)
    try {
        if (iframe.contentDocument?.readyState === 'complete') {
            resizeIframe(iframe);
            observeContent(iframe);
        }
    } catch {
        // cross-origin
    }
};

export const initExamples = (): void => {
    document.querySelectorAll<HTMLIFrameElement>('iframe.cdx-example-container').forEach(bind);
};
