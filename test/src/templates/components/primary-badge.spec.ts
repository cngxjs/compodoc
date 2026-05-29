import { beforeAll, describe, expect, it } from 'vitest';
import I18nEngine from '../../../../src/app/engines/i18n.engine';
import { PrimaryBadge } from '../../../../src/templates/components/PrimaryBadge';

beforeAll(() => {
    I18nEngine.init('en-US');
});

describe('PrimaryBadge', () => {
    it('returns an empty string when docsKind is undefined', () => {
        expect(PrimaryBadge({ docsKind: undefined })).toBe('');
    });

    it('returns an empty string when docsKind is anything other than "primary"', () => {
        expect(PrimaryBadge({ docsKind: 'reference' })).toBe('');
        expect(PrimaryBadge({ docsKind: 'PRIMARY' })).toBe('');
        expect(PrimaryBadge({ docsKind: '' })).toBe('');
    });

    it('renders the badge when docsKind === "primary"', () => {
        const html = PrimaryBadge({ docsKind: 'primary' });
        expect(html).toContain('cdx-badge cdx-badge--primary');
        expect(html).toContain('data-cdx-docskind="primary"');
        expect(html).toContain('title="Primary teaching surface for this category"');
        expect(html).toContain('>Primary<');
        expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
    });
});
