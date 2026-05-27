import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Configuration from '../../../../src/app/configuration';
import { resolveBucketSegments } from '../../../../src/templates/helpers/breadcrumb-bucket';

describe('resolveBucketSegments', () => {
    const originalMenuLayout = Configuration.mainData.menuLayout;
    const originalGroupDepth = Configuration.mainData.groupDepth;

    beforeEach(() => {
        Configuration.mainData.menuLayout = 'feature';
        Configuration.mainData.groupDepth = 2;
    });

    afterEach(() => {
        Configuration.mainData.menuLayout = originalMenuLayout;
        Configuration.mainData.groupDepth = originalGroupDepth;
    });

    it('returns null in type layout regardless of category', () => {
        Configuration.mainData.menuLayout = 'type';
        expect(
            resolveBucketSegments({ category: 'ui/feedback/toast', file: 'src/foo.ts' })
        ).toBeNull();
    });

    it('splits @category on / when set', () => {
        expect(resolveBucketSegments({ category: 'ui/feedback/toast' })).toEqual([
            'ui',
            'feedback',
            'toast'
        ]);
    });

    it('strips empty segments and whitespace from category', () => {
        expect(resolveBucketSegments({ category: ' ui / / feedback / ' })).toEqual([
            'ui',
            'feedback'
        ]);
    });

    it('falls back to deriveGroupKey when category is missing', () => {
        expect(
            resolveBucketSegments({ file: 'src/app/features/admin/admin.component.ts' })
        ).toEqual(['features', 'admin']);
    });

    it('falls back to deriveGroupKey when category is empty string', () => {
        expect(
            resolveBucketSegments({
                category: '',
                file: 'src/app/dashboard/stats.component.ts'
            })
        ).toEqual(['dashboard']);
    });

    it('falls back to deriveGroupKey when category is whitespace-only', () => {
        expect(
            resolveBucketSegments({
                category: '   ',
                file: 'src/app/users/user.service.ts'
            })
        ).toEqual(['users']);
    });

    it('respects groupDepth on the folder fallback', () => {
        Configuration.mainData.groupDepth = 1;
        expect(
            resolveBucketSegments({ file: 'src/app/features/admin/admin.component.ts' })
        ).toEqual(['features']);
    });

    it('returns null when neither category nor file produce a path', () => {
        expect(resolveBucketSegments({ file: 'src/index.ts' })).toBeNull();
        expect(resolveBucketSegments({ category: '' })).toBeNull();
        expect(resolveBucketSegments({})).toBeNull();
    });

    it('returns null for non-object input', () => {
        expect(resolveBucketSegments(null)).toBeNull();
        expect(resolveBucketSegments(undefined)).toBeNull();
        expect(resolveBucketSegments('string')).toBeNull();
    });

    it('preserves verbatim casing — no title-case, no i18n', () => {
        expect(resolveBucketSegments({ category: 'UI/Feedback/Toast' })).toEqual([
            'UI',
            'Feedback',
            'Toast'
        ]);
    });
});
