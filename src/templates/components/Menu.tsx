import Html from '@kitajs/html';
import { t } from '../helpers';
import { isToggled, getAloneElements, stripUrl } from '../helpers/menu-helpers';
import { SearchInput } from './SearchInput';
import {
    IconHome,
    IconGrid,
    IconClass,
    IconList,
    IconEntity,
    IconSettings,
    IconBook,
    IconModule,
    IconCube,
    IconGitBranch,
    IconBarChart,
    IconPodium,
    IconComponent,
    IconDirective,
    IconInjectable,
    IconPipe,
    IconInterceptor,
    IconGuard,
    IconInterface,
    IconChevronDown,
    IconChevronUp
} from './Icons';

type MenuProps = {
    readonly data: any;
};

/** Chevron icon based on toggle state */
const chevron = (type: string): string =>
    isToggled(type) ? IconChevronUp('cdx-chevron') : IconChevronDown('cdx-chevron');

/** Entity link href with duplicateName fallback */
const entityHref = (prefix: string, item: any): string =>
    `${prefix}/${item.duplicateName ?? item.name}.html`;

/** Inline badge for entity type indicators */
const Badge = (props: { label: string; cssClass: string }): string =>
    (<span class={`cdx-badge ${props.cssClass}`}>{props.label}</span>) as string;

/** Render a single entity link */
const EntityLink = (props: {
    href: string;
    name: string;
    deprecated?: boolean;
    context?: string;
    contextId?: string;
    standalone?: boolean;
    isToken?: boolean;
    beta?: boolean;
    factoryKind?: string;
}): string =>
    (
        //TODO: show standalone-badge only if app is not standalone and has modules

        <li class="link">
            <a
                href={props.href}
                data-type="entity-link"
                data-context={props.context}
                data-context-id={props.contextId}
                class={props.deprecated ? 'deprecated-name' : ''}
            >
                {props.name}
                {props.standalone ? Badge({ label: 'S', cssClass: 'cdx-badge--standalone' }) : ''}
                {props.isToken ? Badge({ label: 'T', cssClass: 'cdx-badge--token' }) : ''}
                {props.beta ? Badge({ label: 'B', cssClass: 'cdx-badge--beta' }) : ''}
                {props.factoryKind ? Badge({ label: props.factoryKind.charAt(0).toUpperCase(), cssClass: 'cdx-badge--factory' }) : ''}
            </a>
        </li>
    ) as string;

/**
 * A collapsible chapter section with optional @category grouping.
 */
const EntitySection = (props: {
    items: any[];
    categorized?: Record<string, any[]>;
    type: string;
    iconHtml: string;
    labelKey: string;
    hrefPrefix: string;
}): string => {
    if (!props.items?.length) return '';
    const id = `${props.type}-links`;
    const hasCats = props.categorized && Object.keys(props.categorized).length > 0;

    return (
        <li class="chapter">
            <button
                class="simple menu-toggler"
                type="button"
                data-cdx-toggle="collapse"
                data-cdx-target={`#${id}`}
                aria-expanded={isToggled(props.type) ? 'true' : 'false'}
                aria-controls={id}
            >
                {props.iconHtml}
                <span>{t(props.labelKey)}</span>
                {chevron(props.type)}
            </button>
            <ul class={`links collapse${isToggled(props.type) ? ' in' : ''}`} id={id}>
                {hasCats
                    ? Object.entries(props.categorized!).map(([key, items]) => (
                          <li class="chapter inner">
                              <button
                                  class="simple menu-toggler"
                                  type="button"
                                  data-cdx-toggle="collapse"
                                  data-cdx-target={`#${props.type}-category-${key}`}
                                  aria-expanded="true"
                                  aria-controls={`${props.type}-category-${key}`}
                              >
                                  <span class="link-name">{key || 'Uncategorized'}</span>
                                  {IconChevronDown('cdx-chevron')}
                              </button>
                              <ul class="links collapse in" id={`${props.type}-category-${key}`}>
                                  {items.map((item: any) =>
                                      EntityLink({
                                          href: entityHref(props.hrefPrefix, item),
                                          name: item.name,
                                          deprecated: item.deprecated,
                                          standalone: item.standalone,
                                          isToken: item.isToken,
                                          beta: item.beta,
                                          factoryKind: item.factoryKind
                                      })
                                  )}
                              </ul>
                          </li>
                      ))
                    : props.items.map(item =>
                          EntityLink({
                              href: entityHref(props.hrefPrefix, item),
                              name: item.name,
                              deprecated: item.deprecated,
                              standalone: item.standalone,
                              isToken: item.isToken,
                              beta: item.beta,
                              factoryKind: item.factoryKind
                          })
                      )}
            </ul>
        </li>
    ) as string;
};

/** Module sub-section (components/directives/injectables/pipes within a module) */
const ModuleSubSection = (props: {
    items: any[];
    type: string;
    iconHtml: string;
    labelKey: string;
    hrefPrefix: string;
    moduleId: string;
}): string => {
    if (!props.items?.length) return '';
    const id = `${props.type}-links-${props.moduleId}`;

    return (
        <li class="chapter inner">
            <button
                class="simple menu-toggler"
                type="button"
                data-cdx-toggle="collapse"
                data-cdx-target={`#${id}`}
                aria-expanded="false"
                aria-controls={id}
            >
                {props.iconHtml}
                <span>{t(props.labelKey)}</span>
                {chevron(props.type)}
            </button>
            <ul class="links collapse" id={id}>
                {props.items.map((item: any) =>
                    EntityLink({
                        href: entityHref(props.hrefPrefix, item),
                        name: item.name,
                        deprecated: item.deprecated,
                        context: 'sub-entity',
                        contextId: 'modules'
                    })
                )}
            </ul>
        </li>
    ) as string;
};

export const Menu = (props: MenuProps): string => {
    const d = props.data;

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
                            <img
                                alt={d.documentationMainName}
                                class="img-responsive"
                                data-type="custom-logo"
                                data-src={stripUrl('images/', d.customLogo)}
                            />
                        </a>
                    ) : (
                        <a href="index.html" data-type="index-link">
                            {d.documentationMainName}
                        </a>
                    )}
                </li>

                <li class="divider"></li>
                {!d.disableSearch && <li class="search-wrapper">{SearchInput()}</li>}

                {/* Getting Started */}
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html">
                        {IconHome()}
                        {t('getting-started')}
                    </a>
                    <ul class="links">
                        {!d.disableOverview && (
                            <li class="link">
                                <a
                                    href={d.readme ? 'overview.html' : 'index.html'}
                                    data-type="chapter-link"
                                >
                                    {IconGrid()}
                                    {t('overview')}
                                </a>
                            </li>
                        )}
                        {d.readme && (
                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    {IconClass()}
                                    {d.disableOverview ? t('overview') : t('readme')}
                                </a>
                            </li>
                        )}
                        {(d.markdowns ?? []).map((md: any) => (
                            <li class="link">
                                <a
                                    href={md.name !== 'readme' ? `${md.name}.html` : 'index.html'}
                                    data-type="chapter-link"
                                >
                                    {IconClass()}
                                    {md.uppername}
                                </a>
                            </li>
                        ))}
                        {!d.disableDependencies &&
                            (d.packageDependencies || d.packagePeerDependencies) && (
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        {IconList()}
                                        {t('dependencies')}
                                    </a>
                                </li>
                            )}
                        {!d.disableProperties && d.packageProperties && (
                            <li class="link">
                                <a href="properties.html" data-type="chapter-link">
                                    {IconEntity()}
                                    {t('properties')}
                                </a>
                            </li>
                        )}
                    </ul>
                </li>

                {/* App Configuration */}
                {d.appConfig?.length > 0 && (
                    <li class="chapter">
                        <a data-type="chapter-link" href="app-config.html">
                            {IconSettings()}App Configuration
                        </a>
                    </li>
                )}

                {/* Additional Pages */}
                {d.additionalPages?.length > 0 && (
                    <li class="chapter additional">
                        <button
                            class="simple menu-toggler"
                            type="button"
                            data-cdx-toggle="collapse"
                            data-cdx-target="#additional-pages"
                            aria-expanded={isToggled('additionalPages') ? 'true' : 'false'}
                            aria-controls="additional-pages"
                        >
                            {IconBook()}
                            <span>{d.includesName}</span>
                            {chevron('additionalPages')}
                        </button>
                        <ul
                            class={`links collapse${isToggled('additionalPages') ? ' in' : ''}`}
                            id="additional-pages"
                        >
                            {d.additionalPages.map((page: any) =>
                                page.children?.length > 0 && page.depth === 1 ? (
                                    <li class="chapter inner">
                                        <a
                                            data-type="chapter-link"
                                            href={`${page.path}/${page.filename}.html`}
                                            data-context-id="additional"
                                        >
                                            <div
                                                class="menu-toggler linked"
                                                role="button"
                                                data-cdx-toggle="collapse"
                                                data-cdx-target={`#additional-page-${page.id}`}
                                                aria-expanded="false"
                                                aria-controls={`additional-page-${page.id}`}
                                            >
                                                <span class="link-name">{page.name}</span>
                                                {IconChevronDown('cdx-chevron')}
                                            </div>
                                        </a>
                                        <ul
                                            class="links collapse"
                                            id={`additional-page-${page.id}`}
                                        >
                                            {page.children.map((child: any) => (
                                                <li
                                                    class={`link${child.depth > 1 ? ` for-chapter${child.depth}` : ''}`}
                                                >
                                                    <a
                                                        href={`${child.path}/${child.filename}.html`}
                                                        data-type="entity-link"
                                                        data-context="sub-entity"
                                                        data-context-id="additional"
                                                    >
                                                        {child.name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ) : (
                                    <li
                                        class={`link${page.depth > 1 ? ` for-chapter${page.depth}` : ''}`}
                                    >
                                        <a
                                            href={`${page.path}/${page.filename}.html`}
                                            data-type="entity-link"
                                            data-context-id="additional"
                                        >
                                            {page.name}
                                        </a>
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
                            <div
                                class="menu-toggler linked"
                                role="button"
                                data-cdx-toggle="collapse"
                                data-cdx-target="#modules-links"
                                aria-expanded={isToggled('modules') ? 'true' : 'false'}
                                aria-controls="modules-links"
                            >
                                {IconModule()}
                                <span class="link-name">{t('modules')}</span>
                                {chevron('modules')}
                            </div>
                        </a>
                        <ul
                            class={`links collapse${isToggled('modules') ? ' in' : ''}`}
                            id="modules-links"
                        >
                            {d.modules.map((mod: any) => (
                                <li class="link">
                                    <a
                                        href={`modules/${mod.name}.html`}
                                        data-type="entity-link"
                                        class={mod.deprecated ? 'deprecated-name' : ''}
                                    >
                                        {mod.name}
                                    </a>
                                    {ModuleSubSection({
                                        items: mod.compodocLinks?.components,
                                        type: 'components',
                                        iconHtml: IconComponent(),
                                        labelKey: 'components',
                                        hrefPrefix: 'components',
                                        moduleId: mod.id
                                    })}
                                    {ModuleSubSection({
                                        items: mod.compodocLinks?.directives,
                                        type: 'directives',
                                        iconHtml: IconDirective(),
                                        labelKey: 'directives',
                                        hrefPrefix: 'directives',
                                        moduleId: mod.id
                                    })}
                                    {ModuleSubSection({
                                        items: mod.compodocLinks?.injectables,
                                        type: 'injectables',
                                        iconHtml: IconInjectable(),
                                        labelKey: 'injectables',
                                        hrefPrefix: 'injectables',
                                        moduleId: mod.id
                                    })}
                                    {ModuleSubSection({
                                        items: mod.compodocLinks?.pipes,
                                        type: 'pipes',
                                        iconHtml: IconPipe(),
                                        labelKey: 'pipes',
                                        hrefPrefix: 'pipes',
                                        moduleId: mod.id
                                    })}
                                </li>
                            ))}
                        </ul>
                    </li>
                )}

                {/* Standalone entity sections */}
                {aloneComponents.length > 0 &&
                    EntitySection({
                        items: aloneComponents,
                        categorized: d.categorizedComponents,
                        type: 'components',
                        iconHtml: IconComponent(),
                        labelKey: 'components',
                        hrefPrefix: 'components'
                    })}
                {aloneEntities.length > 0 &&
                    EntitySection({
                        items: aloneEntities,
                        type: 'entities',
                        iconHtml: IconEntity(),
                        labelKey: 'entities',
                        hrefPrefix: 'entities'
                    })}
                {aloneDirectives.length > 0 &&
                    EntitySection({
                        items: aloneDirectives,
                        categorized: d.categorizedDirectives,
                        type: 'directives',
                        iconHtml: IconDirective(),
                        labelKey: 'directives',
                        hrefPrefix: 'directives'
                    })}
                {d.classes?.length > 0 &&
                    EntitySection({
                        items: d.classes,
                        categorized: d.categorizedClasses,
                        type: 'classes',
                        iconHtml: IconClass(),
                        labelKey: 'classes',
                        hrefPrefix: 'classes'
                    })}
                {aloneInjectables.length > 0 &&
                    EntitySection({
                        items: aloneInjectables,
                        categorized: d.categorizedInjectables,
                        type: 'injectables',
                        iconHtml: IconInjectable(),
                        labelKey: 'injectables',
                        hrefPrefix: 'injectables'
                    })}
                {d.interceptors?.length > 0 &&
                    EntitySection({
                        items: d.interceptors,
                        categorized: d.categorizedInterceptors,
                        type: 'interceptors',
                        iconHtml: IconInterceptor(),
                        labelKey: 'interceptors',
                        hrefPrefix: 'interceptors'
                    })}
                {d.guards?.length > 0 &&
                    EntitySection({
                        items: d.guards,
                        categorized: d.categorizedGuards,
                        type: 'guards',
                        iconHtml: IconGuard(),
                        labelKey: 'guards',
                        hrefPrefix: 'guards'
                    })}
                {d.interfaces?.length > 0 &&
                    EntitySection({
                        items: d.interfaces,
                        categorized: d.categorizedInterfaces,
                        type: 'interfaces',
                        iconHtml: IconInterface(),
                        labelKey: 'interfaces',
                        hrefPrefix: 'interfaces'
                    })}
                {alonePipes.length > 0 &&
                    EntitySection({
                        items: alonePipes,
                        categorized: d.categorizedPipes,
                        type: 'pipes',
                        iconHtml: IconPipe(),
                        labelKey: 'pipes',
                        hrefPrefix: 'pipes'
                    })}

                {/* Miscellaneous */}
                {d.miscellaneous && (
                    <li class="chapter">
                        <button
                            class="simple menu-toggler"
                            type="button"
                            data-cdx-toggle="collapse"
                            data-cdx-target="#miscellaneous-links"
                            aria-expanded={isToggled('miscellaneous') ? 'true' : 'false'}
                            aria-controls="miscellaneous-links"
                        >
                            {IconCube()}
                            <span>{t('miscellaneous')}</span>
                            {chevron('miscellaneous')}
                        </button>
                        <ul
                            class={`links collapse${isToggled('miscellaneous') ? ' in' : ''}`}
                            id="miscellaneous-links"
                        >
                            {d.miscellaneous.enumerations?.length > 0 && (
                                <li class="link">
                                    <a
                                        href="miscellaneous/enumerations.html"
                                        data-type="entity-link"
                                    >
                                        {t('enums')}
                                    </a>
                                </li>
                            )}
                            {d.miscellaneous.functions?.length > 0 && (
                                <li class="link">
                                    <a href="miscellaneous/functions.html" data-type="entity-link">
                                        {t('functions')}
                                    </a>
                                </li>
                            )}
                            {d.miscellaneous.typealiases?.length > 0 && (
                                <li class="link">
                                    <a
                                        href="miscellaneous/typealiases.html"
                                        data-type="entity-link"
                                    >
                                        {t('type-aliases')}
                                    </a>
                                </li>
                            )}
                            {d.miscellaneous.variables?.length > 0 && (
                                <li class="link">
                                    <a href="miscellaneous/variables.html" data-type="entity-link">
                                        {t('variables')}
                                    </a>
                                </li>
                            )}
                        </ul>
                    </li>
                )}

                {/* Routes */}
                {!d.disableRoutesGraph && d.routes && (
                    <li class="chapter">
                        <a data-type="chapter-link" href="routes.html">
                            {IconGitBranch()}
                            {t('routes')}
                        </a>
                    </li>
                )}

                {/* Coverage */}
                {!d.disableCoverage && (
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html">
                            {IconBarChart()}
                            {t('coverage-page-title')}
                        </a>
                    </li>
                )}

                {/* Unit Test */}
                {d.unitTestData && (
                    <li class="chapter">
                        <a data-type="chapter-link" href="unit-test.html">
                            {IconPodium()}
                            {t('unit-test-coverage')}
                        </a>
                    </li>
                )}

                {/* Generator footer */}
                {!d.hideGenerator && (
                    <>
                        <li class="divider"></li>
                        <li class="copyright">
                            {t('generated-using')}{' '}
                            <a
                                href="https://compodoc.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {d.theme &&
                                ['readthedocs', 'vagrant', 'postmark'].some((t: string) =>
                                    d.theme.includes(t)
                                ) ? (
                                    <img
                                        data-src="images/compodoc-vectorise-inverted.png"
                                        class="img-responsive"
                                        data-type="compodoc-logo"
                                        alt="Compodoc logo"
                                    />
                                ) : (
                                    <img
                                        data-src="images/compodoc-vectorise.png"
                                        class="img-responsive"
                                        data-type="compodoc-logo"
                                        alt="Compodoc logo"
                                    />
                                )}
                            </a>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    ) as string;
};
