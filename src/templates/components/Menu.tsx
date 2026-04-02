import Html from '@kitajs/html';
import { t } from '../helpers';
import { isToggled, getAloneElements, stripUrl } from '../helpers/menu-helpers';
import { SearchInput } from './SearchInput';

type MenuProps = {
    readonly data: any;
    readonly mode: 'normal' | 'mobile';
};

/** ID prefix: '' for normal, 'xs-' for mobile */
const px = (mode: string): string => mode === 'normal' ? '' : 'xs-';

/** Arrow icon based on toggle state */
const arrow = (type: string): string =>
    isToggled(type) ? 'ion-ios-arrow-up' : 'ion-ios-arrow-down';

/** Entity link href with duplicateName fallback */
const entityHref = (prefix: string, item: any): string =>
    `${prefix}/${item.duplicateName ?? item.name}.html`;

/** Render a single entity link */
const EntityLink = (props: { href: string; name: string; deprecated?: boolean; context?: string; contextId?: string }): string => (
    <li class="link">
        <a href={props.href}
            data-type="entity-link"
            data-context={props.context}
            data-context-id={props.contextId}
            class={props.deprecated ? 'deprecated-name' : ''}>{props.name}</a>
    </li>
) as string;

/**
 * A collapsible chapter section with optional @category grouping.
 * Used for components, directives, classes, injectables, interceptors, guards, interfaces, pipes.
 */
const EntitySection = (props: {
    items: any[];
    categorized?: Record<string, any[]>;
    type: string;
    icon: string;
    labelKey: string;
    hrefPrefix: string;
    mode: string;
}): string => {
    if (!props.items?.length) return '';
    const p = px(props.mode);
    const id = `${p}${props.type}-links`;
    const hasCats = props.categorized && Object.keys(props.categorized).length > 0;

    return (
        <li class="chapter">
            <div class="simple menu-toggler" data-cdx-toggle="collapse" data-cdx-target={`#${id}`}>
                <span class={`icon ${props.icon}`}></span>
                <span>{t(props.labelKey)}</span>
                <span class={`icon ${arrow(props.type)}`}></span>
            </div>
            <ul class={`links collapse${isToggled(props.type) ? ' in' : ''}`} id={id}>
                {hasCats ? (
                    Object.entries(props.categorized!).map(([key, items]) => (
                        <li class="chapter inner">
                            <div class="simple menu-toggler" data-cdx-toggle="collapse" data-cdx-target={`#${p}${props.type}-category-${key}`}>
                                <span class="link-name">{key || 'Uncategorized'}</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse in" id={`${p}${props.type}-category-${key}`}>
                                {items.map((item: any) => EntityLink({
                                    href: entityHref(props.hrefPrefix, item),
                                    name: item.name,
                                    deprecated: item.deprecated,
                                }))}
                            </ul>
                        </li>
                    ))
                ) : (
                    props.items.map(item => EntityLink({
                        href: entityHref(props.hrefPrefix, item),
                        name: item.name,
                        deprecated: item.deprecated,
                    }))
                )}
            </ul>
        </li>
    ) as string;
};

/** Module sub-section (components/directives/injectables/pipes within a module) */
const ModuleSubSection = (props: {
    items: any[];
    type: string;
    icon: string;
    labelKey: string;
    hrefPrefix: string;
    moduleId: string;
    mode: string;
}): string => {
    if (!props.items?.length) return '';
    const p = px(props.mode);
    const id = `${p}${props.type}-links-${props.moduleId}`;

    return (
        <li class="chapter inner">
            <div class="simple menu-toggler" data-cdx-toggle="collapse" data-cdx-target={`#${id}`}>
                <span class={`icon ${props.icon}`}></span>
                <span>{t(props.labelKey)}</span>
                <span class={`icon ${arrow(props.type)}`}></span>
            </div>
            <ul class="links collapse" id={id}>
                {props.items.map((item: any) => EntityLink({
                    href: entityHref(props.hrefPrefix, item),
                    name: item.name,
                    deprecated: item.deprecated,
                    context: 'sub-entity',
                    contextId: 'modules',
                }))}
            </ul>
        </li>
    ) as string;
};

export const Menu = (props: MenuProps): string => {
    const d = props.data;
    const m = props.mode;
    const p = px(m);

    // Filter standalone elements (not in any module)
    const aloneComponents = d.components ? getAloneElements(d.components) : [];
    const aloneDirectives = d.directives ? getAloneElements(d.directives) : [];
    const aloneInjectables = d.injectables ? getAloneElements(d.injectables) : [];
    const alonePipes = d.pipes ? getAloneElements(d.pipes) : [];
    const aloneEntities = d.entities ? getAloneElements(d.entities) : [];

    return (
        <nav>
            <ul class="list">
                <li class="title">
                    {d.customLogo ? (
                        <a href="index.html" data-type="index-link">
                            <img alt="" class="img-responsive" data-type="custom-logo" data-src={stripUrl('images/', d.customLogo)} />
                        </a>
                    ) : (
                        <a href="index.html" data-type="index-link">{d.documentationMainName}</a>
                    )}
                </li>

                <li class="divider"></li>
                {m === 'normal' && !d.disableSearch && SearchInput()}

                {/* Getting Started */}
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>{t('getting-started')}</a>
                    <ul class="links">
                        {!d.disableOverview && (
                            <li class="link">
                                <a href={d.readme ? 'overview.html' : 'index.html'} data-type="chapter-link">
                                    <span class="icon ion-ios-keypad"></span>{t('overview')}
                                </a>
                            </li>
                        )}
                        {d.readme && (
                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                    {d.disableOverview ? t('overview') : t('readme')}
                                </a>
                            </li>
                        )}
                        {(d.markdowns ?? []).map((md: any) => (
                            <li class="link">
                                <a href={md.name !== 'readme' ? `${md.name}.html` : 'index.html'} data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>{md.uppername}
                                </a>
                            </li>
                        ))}
                        {!d.disableDependencies && (d.packageDependencies || d.packagePeerDependencies) && (
                            <li class="link">
                                <a href="dependencies.html" data-type="chapter-link">
                                    <span class="icon ion-ios-list"></span>{t('dependencies')}
                                </a>
                            </li>
                        )}
                        {!d.disableProperties && d.packageProperties && (
                            <li class="link">
                                <a href="properties.html" data-type="chapter-link">
                                    <span class="icon ion-ios-apps"></span>{t('properties')}
                                </a>
                            </li>
                        )}
                    </ul>
                </li>

                {/* Additional Pages */}
                {d.additionalPages && (
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-cdx-toggle="collapse" data-cdx-target={`#${p}additional-pages`}>
                            <span class="icon ion-ios-book"></span>
                            <span>{d.includesName}</span>
                            <span class={`icon ${arrow('additionalPages')}`}></span>
                        </div>
                        <ul class={`links collapse${isToggled('additionalPages') ? ' in' : ''}`} id={`${p}additional-pages`}>
                            {d.additionalPages.map((page: any) =>
                                page.children?.length > 0 && page.depth === 1 ? (
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href={`${page.path}/${page.filename}.html`} data-context-id="additional">
                                            <div class="menu-toggler linked" data-cdx-toggle="collapse" data-cdx-target={`#${p}additional-page-${page.id}`}>
                                                <span class="link-name">{page.name}</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" id={`${p}additional-page-${page.id}`}>
                                            {page.children.map((child: any) => (
                                                <li class={`link${child.depth > 1 ? ` for-chapter${child.depth}` : ''}`}>
                                                    <a href={`${child.path}/${child.filename}.html`} data-type="entity-link" data-context="sub-entity" data-context-id="additional">{child.name}</a>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ) : (
                                    <li class={`link${page.depth > 1 ? ` for-chapter${page.depth}` : ''}`}>
                                        <a href={`${page.path}/${page.filename}.html`} data-type="entity-link" data-context-id="additional">{page.name}</a>
                                    </li>
                                )
                            )}
                        </ul>
                    </li>
                )}

                {/* Modules */}
                {d.modules?.length > 0 && (
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-cdx-toggle="collapse" data-cdx-target={`#${p}modules-links`}>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">{t('modules')}</span>
                                <span class={`icon ${arrow('modules')}`}></span>
                            </div>
                        </a>
                        <ul class={`links collapse${isToggled('modules') ? ' in' : ''}`} id={`${p}modules-links`}>
                            {d.modules.map((mod: any) => (<>
                                <li class="link">
                                    <a href={`modules/${mod.name}.html`} data-type="entity-link" class={mod.deprecated ? 'deprecated-name' : ''}>{mod.name}</a>
                                    {ModuleSubSection({ items: mod.compodocLinks?.components, type: 'components', icon: 'ion-md-cog', labelKey: 'components', hrefPrefix: 'components', moduleId: mod.id, mode: m })}
                                    {ModuleSubSection({ items: mod.compodocLinks?.directives, type: 'directives', icon: 'ion-md-code-working', labelKey: 'directives', hrefPrefix: 'directives', moduleId: mod.id, mode: m })}
                                    {ModuleSubSection({ items: mod.compodocLinks?.injectables, type: 'injectables', icon: 'ion-md-arrow-round-down', labelKey: 'injectables', hrefPrefix: 'injectables', moduleId: mod.id, mode: m })}
                                    {ModuleSubSection({ items: mod.compodocLinks?.pipes, type: 'pipes', icon: 'ion-md-add', labelKey: 'pipes', hrefPrefix: 'pipes', moduleId: mod.id, mode: m })}
                                </li>
                            </>))}
                        </ul>
                    </li>
                )}

                {/* Standalone entity sections */}
                {aloneComponents.length > 0 && EntitySection({ items: aloneComponents, categorized: d.categorizedComponents, type: 'components', icon: 'ion-md-cog', labelKey: 'components', hrefPrefix: 'components', mode: m })}
                {aloneEntities.length > 0 && EntitySection({ items: aloneEntities, type: 'entities', icon: 'ion-ios-apps', labelKey: 'entities', hrefPrefix: 'entities', mode: m })}
                {aloneDirectives.length > 0 && EntitySection({ items: aloneDirectives, categorized: d.categorizedDirectives, type: 'directives', icon: 'ion-md-code-working', labelKey: 'directives', hrefPrefix: 'directives', mode: m })}
                {d.classes?.length > 0 && EntitySection({ items: d.classes, categorized: d.categorizedClasses, type: 'classes', icon: 'ion-ios-paper', labelKey: 'classes', hrefPrefix: 'classes', mode: m })}
                {aloneInjectables.length > 0 && EntitySection({ items: aloneInjectables, categorized: d.categorizedInjectables, type: 'injectables', icon: 'ion-md-arrow-round-down', labelKey: 'injectables', hrefPrefix: 'injectables', mode: m })}
                {d.interceptors?.length > 0 && EntitySection({ items: d.interceptors, categorized: d.categorizedInterceptors, type: 'interceptors', icon: 'ion-ios-swap', labelKey: 'interceptors', hrefPrefix: 'interceptors', mode: m })}
                {d.guards?.length > 0 && EntitySection({ items: d.guards, categorized: d.categorizedGuards, type: 'guards', icon: 'ion-ios-lock', labelKey: 'guards', hrefPrefix: 'guards', mode: m })}
                {d.interfaces?.length > 0 && EntitySection({ items: d.interfaces, categorized: d.categorizedInterfaces, type: 'interfaces', icon: 'ion-md-information-circle-outline', labelKey: 'interfaces', hrefPrefix: 'interfaces', mode: m })}
                {alonePipes.length > 0 && EntitySection({ items: alonePipes, categorized: d.categorizedPipes, type: 'pipes', icon: 'ion-md-add', labelKey: 'pipes', hrefPrefix: 'pipes', mode: m })}

                {/* Miscellaneous */}
                {d.miscellaneous && (
                    <li class="chapter">
                        <div class="simple menu-toggler" data-cdx-toggle="collapse" data-cdx-target={`#${p}miscellaneous-links`}>
                            <span class="icon ion-ios-cube"></span>
                            <span>{t('miscellaneous')}</span>
                            <span class={`icon ${arrow('miscellaneous')}`}></span>
                        </div>
                        <ul class={`links collapse${isToggled('miscellaneous') ? ' in' : ''}`} id={`${p}miscellaneous-links`}>
                            {d.miscellaneous.enumerations?.length > 0 && (
                                <li class="link"><a href="miscellaneous/enumerations.html" data-type="entity-link">{t('enums')}</a></li>
                            )}
                            {d.miscellaneous.functions?.length > 0 && (
                                <li class="link"><a href="miscellaneous/functions.html" data-type="entity-link">{t('functions')}</a></li>
                            )}
                            {d.miscellaneous.typealiases?.length > 0 && (
                                <li class="link"><a href="miscellaneous/typealiases.html" data-type="entity-link">{t('type-aliases')}</a></li>
                            )}
                            {d.miscellaneous.variables?.length > 0 && (
                                <li class="link"><a href="miscellaneous/variables.html" data-type="entity-link">{t('variables')}</a></li>
                            )}
                        </ul>
                    </li>
                )}

                {/* Routes */}
                {!d.disableRoutesGraph && d.routes && (
                    <li class="chapter">
                        <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>{t('routes')}</a>
                    </li>
                )}

                {/* Coverage */}
                {!d.disableCoverage && (
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>{t('coverage-page-title')}</a>
                    </li>
                )}

                {/* Unit Test */}
                {d.unitTestData && (
                    <li class="chapter">
                        <a data-type="chapter-link" href="unit-test.html"><span class="icon ion-ios-podium"></span>{t('unit-test-coverage')}</a>
                    </li>
                )}

                {/* Generator footer */}
                {!d.hideGenerator && (<>
                    <li class="divider"></li>
                    <li class="copyright">
                        {t('generated-using')} <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            {d.theme && ['readthedocs', 'vagrant', 'postmark'].some((t: string) => d.theme.includes(t))
                                ? <img data-src="images/compodoc-vectorise-inverted.png" class="img-responsive" data-type="compodoc-logo" />
                                : <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo" />
                            }
                        </a>
                    </li>
                </>)}
            </ul>
        </nav>
    ) as string;
};
