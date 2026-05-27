import Configuration from '../../app/configuration';
import { deriveGroupKey } from '../../app/engines/dependencies.engine';

/**
 * Resolve the sidebar bucket path for an entity in `menuLayout: 'feature'` mode.
 *
 * The hero breadcrumb on every entity page mirrors the position the sidebar
 * uses to bucket the entity — explicit `@category` when set, the same
 * folder-fallback `prepareFeatureGroups()` calls otherwise. By delegating
 * to `deriveGroupKey` the breadcrumb cannot drift from the sidebar.
 *
 * Returns `null` when:
 * - `menuLayout !== 'feature'` (caller falls back to `t(breadcrumbLabel)`)
 * - the entity has no category AND `deriveGroupKey` produces no path
 *
 * Segments are NOT i18n'd or title-cased — they come verbatim from the user's
 * `@category` tag or folder names (`ui/feedback/toast` → `['ui','feedback','toast']`).
 */
export const resolveBucketSegments = (entity: unknown): string[] | null => {
    if (Configuration.mainData.menuLayout !== 'feature') {
        return null;
    }
    if (!entity || typeof entity !== 'object') {
        return null;
    }

    const e = entity as { category?: unknown; file?: unknown };

    if (typeof e.category === 'string' && e.category.trim().length > 0) {
        const segments = e.category
            .split('/')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        if (segments.length > 0) {
            return segments;
        }
    }

    if (typeof e.file === 'string' && e.file.length > 0) {
        const depth = Configuration.mainData.groupDepth ?? 2;
        const key = deriveGroupKey(e.file, depth);
        if (key.length > 0) {
            return key.split('/').filter(s => s.length > 0);
        }
    }

    return null;
};
