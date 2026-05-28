/**
 * Bucket-landing inline filter. Only present on
 * `categories/<bucket>.html` pages whose bucket contains ≥ FILTER_THRESHOLD
 * items (gate lives in `BucketLandingPage.tsx`). Filters the card grid by
 *
 *   - free-text query (case-insensitive substring match against
 *     `data-cdx-card-text`, which already holds name + first-sentence
 *     excerpt lowercased at render time);
 *   - per-kind chip toggles (multi-select; empty = "all kinds").
 *
 * Pure DOM, no Pagefind. Pagefind has already indexed each card via its
 * own meta block — search-palette behavior is untouched.
 *
 * Idempotent across SPA navigations: a `WeakSet` guards every bound
 * element so re-running `initBucketLandingFilter()` from `reinitPage()`
 * is a no-op when nothing changed and a clean re-bind when the content
 * was swapped.
 */

const BOUND = new WeakSet<Element>();

interface FilterState {
    query: string;
    activeKinds: Set<string>;
}

export function initBucketLandingFilter(): void {
    const root = document.querySelector<HTMLElement>('[data-cdx-bucket-landing-filter]');
    if (!root || BOUND.has(root)) {
        return;
    }
    BOUND.add(root);

    const input = root.querySelector<HTMLInputElement>('[data-cdx-bucket-landing-input]');
    const chipBar = root.querySelector<HTMLElement>('[data-cdx-bucket-landing-kinds]');
    const emptyMsg = root.querySelector<HTMLElement>('[data-cdx-bucket-landing-empty]');
    // Both the top-row Reset pill and the inline empty-state Reset
    // carry the same data attr — bind every match.
    const resetBtns = Array.from(
        root.querySelectorAll<HTMLButtonElement>('[data-cdx-bucket-landing-reset]')
    );

    const cards = Array.from(document.querySelectorAll<HTMLLIElement>('.cdx-bucket-card'));
    if (!input || cards.length === 0) {
        return;
    }

    const sections = Array.from(
        document.querySelectorAll<HTMLElement>('.cdx-bucket-landing-content .cdx-content-section')
    );

    const state: FilterState = { query: '', activeKinds: new Set<string>() };

    const apply = (): void => {
        const q = state.query;
        let totalVisible = 0;
        for (const card of cards) {
            const kind = card.dataset.cdxKind ?? '';
            const text = card.dataset.cdxCardText ?? '';
            const kindOK = state.activeKinds.size === 0 || state.activeKinds.has(kind);
            const textOK = q === '' || text.includes(q);
            const visible = kindOK && textOK;
            card.toggleAttribute('hidden', !visible);
            if (visible) {
                totalVisible++;
            }
        }

        if (emptyMsg) {
            emptyMsg.toggleAttribute('hidden', totalVisible > 0);
        }
        // Top-row Reset pill is disabled when nothing is active — keeps
        // the filter bar visually static so an empty bucket-landing doesn't
        // render a "Reset" affordance with no work to undo.
        const idle = q === '' && state.activeKinds.size === 0;
        for (const btn of resetBtns) {
            btn.toggleAttribute('disabled', idle);
        }

        // Per-section count badge + hide whole section when it has zero
        // visible cards (an empty `<section>` with just a heading reads as
        // a layout glitch).
        for (const section of sections) {
            const visibleCount = Array.from(
                section.querySelectorAll<HTMLLIElement>('.cdx-bucket-card')
            ).filter(c => !c.hasAttribute('hidden')).length;
            const badge = section.querySelector<HTMLElement>(
                '.cdx-section-heading .cdx-badge--count'
            );
            if (badge) {
                badge.textContent = String(visibleCount);
            }
            section.toggleAttribute('hidden', visibleCount === 0);
        }
    };

    const clearAll = (): void => {
        input.value = '';
        state.query = '';
        state.activeKinds.clear();
        if (chipBar) {
            chipBar
                .querySelectorAll<HTMLButtonElement>('[aria-pressed="true"]')
                .forEach(b => b.setAttribute('aria-pressed', 'false'));
        }
        apply();
        input.focus();
    };

    input.addEventListener('input', () => {
        state.query = input.value.trim().toLowerCase();
        apply();
    });

    input.addEventListener('keydown', e => {
        if (e.key === 'Escape' && (state.query !== '' || state.activeKinds.size > 0)) {
            e.preventDefault();
            clearAll();
        }
    });

    chipBar?.addEventListener('click', e => {
        const chip = (e.target as Element | null)?.closest<HTMLButtonElement>(
            '[data-cdx-bucket-landing-kind]'
        );
        if (!chip) {
            return;
        }
        const kind = chip.dataset.cdxBucketLandingKind;
        if (!kind) {
            return;
        }
        const next = chip.getAttribute('aria-pressed') !== 'true';
        chip.setAttribute('aria-pressed', String(next));
        if (next) {
            state.activeKinds.add(kind);
        } else {
            state.activeKinds.delete(kind);
        }
        apply();
    });

    for (const btn of resetBtns) {
        btn.addEventListener('click', clearAll);
    }

    // Initial paint — paints disabled state on the top-row Reset pill
    // before the user touches anything.
    apply();
}
