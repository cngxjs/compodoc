/**
 * Viewport-triggered animations for donut charts and adoption bars.
 *
 * Donut segments render with stroke-dasharray="0 circumference" and store
 * target values in data-cdx-dasharray / data-cdx-dashoffset.
 *
 * Adoption bars render with width:0 and store target in data-cdx-fill-width.
 *
 * An IntersectionObserver triggers the transition once the element scrolls
 * into view. Respects prefers-reduced-motion (CSS handles instant transition).
 */

function animateDonut(svg: SVGSVGElement): void {
    // Double-rAF ensures the browser paints the initial state (dasharray: 0)
    // before transitioning to the target value. Without this, elements already
    // in the viewport get both states in the same frame and skip the transition.
    requestAnimationFrame(() => requestAnimationFrame(() => {
        const segments = svg.querySelectorAll<SVGCircleElement>('.cdx-donut-segment');
        segments.forEach(seg => {
            const targetArray = seg.getAttribute('data-cdx-dasharray');
            const targetOffset = seg.getAttribute('data-cdx-dashoffset');
            if (targetArray) seg.style.strokeDasharray = targetArray;
            if (targetOffset) seg.style.strokeDashoffset = targetOffset;
        });
    }));
}

function animateFills(): void {
    const fills = document.querySelectorAll<HTMLElement>('[data-cdx-fill-width]');
    fills.forEach(el => {
        const target = el.getAttribute('data-cdx-fill-width');
        if (target) el.style.width = target;
    });
}

export function initAnimations(): void {
    if (typeof IntersectionObserver === 'undefined') {
        // Fallback: animate immediately
        document.querySelectorAll<SVGSVGElement>('[data-cdx-donut]').forEach(animateDonut);
        animateFills();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target;
            if (el instanceof SVGSVGElement && el.hasAttribute('data-cdx-donut')) {
                animateDonut(el);
            }
            if (el instanceof HTMLElement && el.hasAttribute('data-cdx-fill-width')) {
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    el.style.width = el.getAttribute('data-cdx-fill-width') || '0';
                }));
            }
            observer.unobserve(el);
        }
    }, { threshold: 0.3 });

    document.querySelectorAll<SVGSVGElement>('[data-cdx-donut]').forEach(svg => observer.observe(svg));
    document.querySelectorAll<HTMLElement>('[data-cdx-fill-width]').forEach(el => observer.observe(el));
}
