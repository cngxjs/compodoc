import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Configuration from '../../../../src/app/configuration';
import DependenciesEngine from '../../../../src/app/engines/dependencies.engine';
import { ApiReferencePageGenerator } from '../../../../src/app/page-generator/api-reference-page-generator';

/**
 * ApiReferencePageGenerator emits exactly one root-level
 * `references.html` page under `menuLayout: 'feature'`. No-ops under
 * `menuLayout: 'type'` and when the bucket dict is empty.
 */
describe('ApiReferencePageGenerator', () => {
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
        await new ApiReferencePageGenerator().prepare();
        expect(addPageSpy).not.toHaveBeenCalled();
    });

    it('emits nothing when the bucket dict is empty', async () => {
        Configuration.mainData.menuLayout = 'feature';
        DependenciesEngine.categorizedByFeature = {};
        await new ApiReferencePageGenerator().prepare();
        expect(addPageSpy).not.toHaveBeenCalled();
    });

    it('emits exactly one root-level references.html page in feature mode', async () => {
        Configuration.mainData.menuLayout = 'feature';
        DependenciesEngine.categorizedByFeature = {
            'ui/feedback/toast': [{ name: 'Toast', kind: 'component' } as any],
            providers: [{ name: 'provideUserFeature', kind: 'function' } as any]
        };
        await new ApiReferencePageGenerator().prepare();
        expect(addPageSpy).toHaveBeenCalledTimes(1);
        const page = addPageSpy.mock.calls[0][0] as any;
        expect(page).toMatchObject({
            name: 'references',
            filename: 'references',
            context: 'api-reference',
            depth: 0,
            path: ''
        });
    });

    it('uses the "api-reference" context (overridable via --templates)', async () => {
        Configuration.mainData.menuLayout = 'feature';
        DependenciesEngine.categorizedByFeature = {
            providers: [{ name: 'provideUserFeature', kind: 'function' } as any]
        };
        await new ApiReferencePageGenerator().prepare();
        const page = addPageSpy.mock.calls[0][0] as any;
        expect(page.context).toBe('api-reference');
    });
});
