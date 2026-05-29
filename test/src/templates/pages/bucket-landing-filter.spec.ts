import { describe, expect, it } from 'vitest';
import { BucketLandingPage } from '../../../../src/templates/pages/BucketLandingPage';

/**
 * Inline filter strip — threshold gate, markup contract, and per-card
 * data-attr contract that the client filter relies on.
 *
 * The page is rendered by `BucketLandingPage(data)` and the payload
 * arrives as `data.bucketLanding`. We synthesise items here so the spec
 * doesn't depend on the full Configuration singleton.
 */

const FILTER_THRESHOLD = 15;

const makeItems = (
    n: number,
    template: (i: number) => { name: string; kind: string; description?: string }
): Array<{ name: string; kind: string; description?: string }> =>
    Array.from({ length: n }, (_, i) => template(i));

const renderPage = (items: Array<{ name: string; kind: string; description?: string }>): string => {
    return BucketLandingPage({
        bucketLanding: {
            bucket: 'ui/feedback',
            segments: ['ui', 'feedback'],
            depth: 1,
            items
        }
    });
};

describe('BucketLandingPage — inline filter', () => {
    it('omits the filter strip when item count is below the threshold', () => {
        const html = renderPage(
            makeItems(FILTER_THRESHOLD - 1, i => ({
                name: `Comp${i}`,
                kind: 'component'
            }))
        );
        expect(html).not.toContain('data-cdx-bucket-landing-filter');
        expect(html).not.toContain('data-cdx-bucket-landing-input');
    });

    it('renders the filter strip when item count meets the threshold', () => {
        const html = renderPage(
            makeItems(FILTER_THRESHOLD, i => ({
                name: `Comp${i}`,
                kind: 'component'
            }))
        );
        expect(html).toContain('data-cdx-bucket-landing-filter');
        expect(html).toContain('data-cdx-bucket-landing-input');
        expect(html).toContain('id="cdx-bucket-landing-q"');
        // Bucket name interpolated into the placeholder so users on
        // larger buckets see which set they are narrowing. i18n key
        // is `filter-entities`; locale-renderer not bootstrapped in
        // this unit spec so just check the bucket portion.
        expect(html).toContain('(ui/feedback)');
    });

    it('emits one chip per distinct kind in organism-then-type order', () => {
        const items = [
            { name: 'IButton', kind: 'interface' },
            { name: 'CngxButton', kind: 'component' },
            { name: 'CngxRipple', kind: 'directive' },
            ...makeItems(13, i => ({ name: `Extra${i}`, kind: 'component' }))
        ];
        const html = renderPage(items);
        const chipOrder = html.match(/data-cdx-bucket-landing-kind="([^"]+)"/g) ?? [];
        expect(chipOrder).toEqual([
            'data-cdx-bucket-landing-kind="component"',
            'data-cdx-bucket-landing-kind="directive"',
            'data-cdx-bucket-landing-kind="interface"'
        ]);
    });

    it('does not emit the chip toolbar when only a single kind is present', () => {
        const html = renderPage(
            makeItems(FILTER_THRESHOLD, i => ({ name: `Comp${i}`, kind: 'component' }))
        );
        expect(html).toContain('data-cdx-bucket-landing-input');
        expect(html).not.toContain('data-cdx-bucket-landing-kinds');
    });

    it('renders kind-chip counts that match the actual item totals', () => {
        const items = [
            ...makeItems(10, i => ({ name: `Comp${i}`, kind: 'component' })),
            ...makeItems(5, i => ({ name: `Dir${i}`, kind: 'directive' }))
        ];
        const html = renderPage(items);
        const counts = Array.from(
            html.matchAll(/cdx-bucket-landing-kind-chip-count[^>]*>(\d+)</g)
        ).map(m => m[1]);
        expect(counts).toEqual(['10', '5']);
    });

    it('stamps every card with data-cdx-card-name and data-cdx-card-text (lowercased)', () => {
        const items = [{ name: 'CngxButton', kind: 'component', description: 'Primary action.' }];
        const html = renderPage(items);
        expect(html).toContain('data-cdx-card-name="cngxbutton"');
        // Card text is name + " " + lowercased first-sentence excerpt.
        expect(html).toMatch(/data-cdx-card-text="cngxbutton primary action[^"]*"/);
    });

    it('stamps data-cdx-card-text with just the lowercased name when there is no description', () => {
        const items = [{ name: 'CngxButton', kind: 'component' }];
        const html = renderPage(items);
        expect(html).toContain('data-cdx-card-text="cngxbutton"');
    });
});
