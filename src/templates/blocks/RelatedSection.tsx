import Html from '@kitajs/html';
import { renderCustomTemplate } from '../../app/engines/custom-template.engine';
import DependenciesEngine from '../../app/engines/dependencies.engine';
import { logger } from '../../utils/logger';
import { relativeUrl, t } from '../helpers';

/**
 * Renders the `@relatedTo` JSDoc tag as a Related section: chip-list of
 * cross-links to the named symbols. Resolved via
 * `DependenciesEngine.findInCompodoc()` plus a fallback lookup against
 * `tokens` (not included in the merged-data list there). Unresolved
 * symbols still render as an inactive grey chip — and emit a build-time
 * warn so the docs author can see the typo.
 *
 * Override name: `related`.
 */

type RelatedEntry = { name: string; href?: string };

const KIND_HREF_PREFIX: Record<string, string> = {
    component: 'components',
    directive: 'directives',
    pipe: 'pipes',
    injectable: 'injectables',
    token: 'tokens',
    class: 'classes',
    interface: 'interfaces',
    guard: 'guards',
    interceptor: 'interceptors',
    entity: 'entities'
};

const MISC_PLURAL: Record<string, string> = {
    function: 'functions',
    variable: 'variables',
    typealias: 'typealiases',
    enum: 'enumerations',
    enumeration: 'enumerations'
};

const resolveEntry = (name: string, base: string): RelatedEntry => {
    const hit = DependenciesEngine.findInCompodoc(name);
    if (hit && typeof hit !== 'boolean') {
        const e = hit as any;
        if (e.ctype === 'miscellaneous') {
            const plural = MISC_PLURAL[e.subtype] ?? `${e.subtype}s`;
            const tagged = typeof e.category === 'string' && e.category.trim() !== '';
            if (tagged) {
                return { name, href: `${base}miscellaneous/${plural}/${name}.html` };
            }
            return { name, href: `${base}miscellaneous/${plural}.html#${name}` };
        }
        const prefix = KIND_HREF_PREFIX[e.type as string] ?? `${e.type}s`;
        return { name, href: `${base}${prefix}/${name}.html` };
    }
    // Tokens aren't included in findInCompodoc's merged-data list.
    const tokens = (DependenciesEngine as any).tokens as any[] | undefined;
    const token = tokens?.find((tk: any) => tk.name === name);
    if (token) {
        return { name, href: `${base}tokens/${name}.html` };
    }
    return { name };
};

type RelatedSectionProps = {
    readonly entityName: string;
    readonly relatedTo?: readonly string[];
    readonly depth: number;
};

export const RelatedSection = (props: RelatedSectionProps): string => {
    const custom = renderCustomTemplate('related', props);
    if (custom !== null) {
        return custom;
    }
    if (!props.relatedTo || props.relatedTo.length === 0) {
        return '';
    }
    const base = relativeUrl(props.depth);
    const entries = props.relatedTo.map(n => resolveEntry(n, base));
    for (const e of entries) {
        if (!e.href) {
            logger.warn(
                `@relatedTo target "${e.name}" not found in entity index for "${props.entityName}".`
            );
        }
    }
    return (
        <section class="cdx-content-section cdx-related-section" id="related">
            <h3 class="cdx-section-heading">
                {t('related')}
                <a class="cdx-member-permalink" href="#related">
                    #
                </a>
            </h3>
            <ul class="cdx-related-pills">
                {entries.map(e =>
                    e.href ? (
                        <li>
                            <a class="cdx-related-pill" href={e.href}>
                                {e.name}
                            </a>
                        </li>
                    ) : (
                        <li>
                            <span
                                class="cdx-related-pill cdx-related-pill--unresolved"
                                title={t('related-unresolved')}
                            >
                                {e.name}
                            </span>
                        </li>
                    )
                )}
            </ul>
        </section>
    ) as string;
};
