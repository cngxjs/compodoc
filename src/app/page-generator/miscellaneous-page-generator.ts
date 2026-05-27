import { COMPODOC_DEFAULTS } from '../../utils/defaults';
import { logger } from '../../utils/logger';
import Configuration from '../configuration';
import DependenciesEngine from '../engines/dependencies.engine';

interface DetailSpec {
    readonly collectionKey: 'functions' | 'variables' | 'typealiases' | 'enumerations';
    readonly singularKind: 'function' | 'variable' | 'typealias' | 'enumeration';
    readonly dataKey: 'function' | 'variable' | 'typealias' | 'enumeration';
}

const DETAIL_SPECS: readonly DetailSpec[] = [
    { collectionKey: 'functions', singularKind: 'function', dataKey: 'function' },
    { collectionKey: 'variables', singularKind: 'variable', dataKey: 'variable' },
    { collectionKey: 'typealiases', singularKind: 'typealias', dataKey: 'typealias' },
    { collectionKey: 'enumerations', singularKind: 'enumeration', dataKey: 'enumeration' }
] as const;

/** Miscellaneous symbols with a non-empty `@category` tag get their own detail page
 * under `miscellaneous/<plural>/<name>.html`. Untagged entries remain inline anchors
 * on the shared collection page. */
const isTagged = (item: unknown): boolean => {
    const category = (item as { category?: unknown })?.category;
    return typeof category === 'string' && category.trim() !== '';
};

export class MiscellaneousPageGenerator {
    public prepare(someMisc?): Promise<any> {
        logger.info('Prepare miscellaneous');
        Configuration.mainData.miscellaneous = someMisc
            ? someMisc
            : DependenciesEngine.getMiscellaneous();

        return new Promise((resolve, _reject) => {
            if (Configuration.mainData.miscellaneous.functions.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'functions',
                    id: 'miscellaneous-functions',
                    context: 'miscellaneous-functions',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            if (Configuration.mainData.miscellaneous.variables.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'variables',
                    id: 'miscellaneous-variables',
                    context: 'miscellaneous-variables',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            if (Configuration.mainData.miscellaneous.typealiases.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'typealiases',
                    id: 'miscellaneous-typealiases',
                    context: 'miscellaneous-typealiases',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            if (Configuration.mainData.miscellaneous.enumerations.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'enumerations',
                    id: 'miscellaneous-enumerations',
                    context: 'miscellaneous-enumerations',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }

            this.enqueueTaggedDetailPages();

            resolve(true);
        });
    }

    private enqueueTaggedDetailPages(): void {
        const misc = Configuration.mainData.miscellaneous ?? {};
        for (const spec of DETAIL_SPECS) {
            const items = misc[spec.collectionKey] ?? [];
            for (const item of items) {
                if (!isTagged(item)) {
                    continue;
                }
                Configuration.addPage({
                    path: `miscellaneous/${spec.collectionKey}`,
                    name: `miscellaneous-${spec.singularKind}-${item.name}`,
                    filename: item.name,
                    id: `miscellaneous-${spec.singularKind}-${item.name}`,
                    context: `miscellaneous-${spec.singularKind}`,
                    [spec.dataKey]: item,
                    depth: 2,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                } as any);
            }
        }
    }
}
