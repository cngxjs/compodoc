import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Configuration from '../../../../src/app/configuration';
import DependenciesEngine from '../../../../src/app/engines/dependencies.engine';
import { BucketLandingPageGenerator } from '../../../../src/app/page-generator/bucket-landing-page-generator';

/**
 * BucketLandingPageGenerator emits one page per non-empty bucket node
 * (leaf + intermediate folders) when `menuLayout: 'feature'`. No-ops
 * cleanly under `menuLayout: 'type'`.
 */
describe('BucketLandingPageGenerator', () => {
    let addPageSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        addPageSpy = vi.spyOn(Configuration, 'addPage').mockImplementation(() => undefined);
    });

    afterEach(() => {
        addPageSpy.mockRestore();
        DependenciesEngine.categorizedByFeature = {};
        Configuration.mainData.menuLayout = 'type';
    });

    it('emits nothing under menuLayout: "type"', async () => {
        Configuration.mainData.menuLayout = 'type';
        DependenciesEngine.categorizedByFeature = {
            'ui/feedback/toast': [{ name: 'Toast', kind: 'component' } as any]
        };
        await new BucketLandingPageGenerator().prepare();
        expect(addPageSpy).not.toHaveBeenCalled();
    });

    it('emits nothing when the bucket dict is empty', async () => {
        Configuration.mainData.menuLayout = 'feature';
        DependenciesEngine.categorizedByFeature = {};
        await new BucketLandingPageGenerator().prepare();
        expect(addPageSpy).not.toHaveBeenCalled();
    });

    it('emits one page per non-empty node — leaves AND intermediates', async () => {
        Configuration.mainData.menuLayout = 'feature';
        DependenciesEngine.categorizedByFeature = {
            'ui/feedback/toast': [{ name: 'Toast', kind: 'component' } as any],
            'ui/feedback/snackbar': [{ name: 'Snack', kind: 'component' } as any],
            providers: [{ name: 'provideX', kind: 'function' } as any]
        };
        await new BucketLandingPageGenerator().prepare();
        const calls = addPageSpy.mock.calls.map(([page]: any[]) => page);
        const buckets = calls.map(p => p.bucketLanding.bucket).sort();
        // ui/feedback (intermediate) + ui (intermediate) + 2 leaves under
        // ui/feedback + providers (single-segment leaf) = 5 emissions.
        expect(buckets).toEqual([
            'providers',
            'ui',
            'ui/feedback',
            'ui/feedback/snackbar',
            'ui/feedback/toast'
        ]);
    });

    it('aggregates descendant items onto intermediate landings (deduped by kind:name)', async () => {
        Configuration.mainData.menuLayout = 'feature';
        DependenciesEngine.categorizedByFeature = {
            'core/auth/guards': [{ name: 'authGuard', kind: 'guard' } as any],
            'core/auth/interceptors': [{ name: 'authInterceptor', kind: 'interceptor' } as any],
            'core/state': [{ name: 'StateService', kind: 'injectable' } as any]
        };
        await new BucketLandingPageGenerator().prepare();
        const calls = addPageSpy.mock.calls.map(([page]: any[]) => page);
        const coreLanding = calls.find(p => p.bucketLanding.bucket === 'core');
        expect(coreLanding).toBeDefined();
        const names = coreLanding.bucketLanding.items.map((i: any) => i.name).sort();
        expect(names).toEqual(['StateService', 'authGuard', 'authInterceptor']);
    });

    it('emits the correct path / filename / depth for each bucket', async () => {
        Configuration.mainData.menuLayout = 'feature';
        DependenciesEngine.categorizedByFeature = {
            'ui/feedback/toast': [{ name: 'Toast', kind: 'component' } as any]
        };
        await new BucketLandingPageGenerator().prepare();
        const calls = addPageSpy.mock.calls.map(([page]: any[]) => page);
        const leaf = calls.find(p => p.bucketLanding.bucket === 'ui/feedback/toast');
        const mid = calls.find(p => p.bucketLanding.bucket === 'ui/feedback');
        const top = calls.find(p => p.bucketLanding.bucket === 'ui');
        expect(leaf).toMatchObject({
            path: 'categories/ui/feedback',
            filename: 'toast',
            depth: 3
        });
        expect(mid).toMatchObject({ path: 'categories/ui', filename: 'feedback', depth: 2 });
        expect(top).toMatchObject({ path: 'categories', filename: 'ui', depth: 1 });
    });

    it('tags each emitted page with the "bucket-landing" context (overridable)', async () => {
        Configuration.mainData.menuLayout = 'feature';
        DependenciesEngine.categorizedByFeature = {
            providers: [{ name: 'provideUserFeature', kind: 'function' } as any]
        };
        await new BucketLandingPageGenerator().prepare();
        const calls = addPageSpy.mock.calls.map(([page]: any[]) => page);
        expect(calls.every(p => p.context === 'bucket-landing')).toBe(true);
    });
});
