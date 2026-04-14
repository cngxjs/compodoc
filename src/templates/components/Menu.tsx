import Html from '@kitajs/html';
import Configuration from '../../app/configuration';
import { buildGroupTree, type GroupNode } from '../../app/engines/dependencies.engine';
import { t } from '../helpers';
import { getAloneElements, isToggled } from '../helpers/menu-helpers';
import {
    IconBarChart,
    IconBook,
    IconChevronRight,
    IconClass,
    IconComponent,
    IconCube,
    IconDirective,
    IconEntity,
    IconGitBranch,
    IconGrid,
    IconGuard,
    IconHome,
    IconInjectable,
    IconInterceptor,
    IconInterface,
    IconList,
    IconModule,
    IconPipe,
    IconPodium,
    IconSettings
} from './Icons';

type MenuProps = {
    readonly data: any;
};

/** Chevron icon — CSS rotation handles open/closed state */
const chevron = (): string => IconChevronRight('cdx-chevron');

/** Entity link href with duplicateName fallback */
const entityHref = (prefix: string, item: any): string =>
    `${prefix}/${item.duplicateName ?? item.name}.html`;

/** Inline badge for entity type indicators */
const Badge = (props: { label: string; cssClass: string }): string =>
    (<span class={`cdx-badge ${props.cssClass}`}>{props.label}</span>) as string;

/** Render a single entity link */
/** Truncate description to first sentence, max 120 chars */
const previewDesc = (desc?: string): string | undefined => {
    if (!desc) {
        return undefined;
    }
    const stripped = desc.replace(/<[^>]+>/g, '').trim();
    if (!stripped) {
        return undefined;
    }
    const firstSentence = stripped.split(/[.!?]\s/)[0];
    const truncated =
        firstSentence.length > 120 ? `${firstSentence.substring(0, 117)}...` : firstSentence;
    return truncated;
};

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
    entityType?: string;
    selector?: string;
    inputCount?: number;
    outputCount?: number;
    description?: string;
}): string =>
    (
        <li class="link">
            <a
                href={props.href}
                data-type="entity-link"
                data-context={props.context}
                data-context-id={props.contextId}
                class={props.deprecated ? 'cdx-member-name--deprecated' : ''}
                data-cdx-entity-type={props.entityType}
                data-cdx-selector={props.selector || undefined}
                data-cdx-io={
                    props.inputCount || props.outputCount
                        ? `${props.inputCount || 0}/${props.outputCount || 0}`
                        : undefined
                }
                data-cdx-desc={previewDesc(props.description)}
            >
                {props.name}
                {props.deprecated ? Badge({ label: 'D', cssClass: 'cdx-badge--deprecated' }) : ''}
                {props.standalone && Configuration.mainData.hasNgModules
                    ? Badge({ label: 'S', cssClass: 'cdx-badge--standalone' })
                    : ''}
                {props.isToken ? Badge({ label: 'T', cssClass: 'cdx-badge--token' }) : ''}
                {props.beta ? Badge({ label: 'B', cssClass: 'cdx-badge--beta' }) : ''}
                {props.factoryKind
                    ? Badge({
                          label: props.factoryKind.charAt(0).toUpperCase(),
                          cssClass: 'cdx-badge--factory'
                      })
                    : ''}
            </a>
        </li>
    ) as string;

/** Recursive tree node for hierarchical folder groups */
const GroupTree = (props: {
    node: GroupNode;
    type: string;
    hrefPrefix: string;
    depth: number;
    groupDepth: number;
}): string => {
    const hasContent = props.node.items.length > 0 || props.node.children.length > 0;
    if (!hasContent) {
        return '';
    }

    const id = `${props.type}-group-${props.node.fullPath}`;
    // Groups shallower than groupDepth start expanded, deeper start collapsed
    const startExpanded = props.depth < props.groupDepth;

    return (
        <li class="chapter inner" style={`--depth: ${props.depth}`}>
            <button
                class="simple menu-toggler"
                type="button"
                data-cdx-toggle="collapse"
                data-cdx-target={`#${id}`}
                aria-expanded={startExpanded ? 'true' : 'false'}
                aria-controls={id}
            >
                <span class="link-name">
                    {props.node.name.charAt(0).toUpperCase() + props.node.name.slice(1)}
                </span>
                {props.node.items.length > 0 && (
                    <span class="cdx-badge cdx-badge--count">{props.node.items.length}</span>
                )}
                {IconChevronRight('cdx-chevron')}
            </button>
            <ul class={`links collapse${startExpanded ? ' in' : ''}`} id={id}>
                {props.node.children.map(child =>
                    GroupTree({
                        node: child,
                        type: props.type,
                        hrefPrefix: props.hrefPrefix,
                        depth: props.depth + 1,
                        groupDepth: props.groupDepth
                    })
                )}
                {props.node.items.map((item: any) =>
                    EntityLink({
                        href: entityHref(props.hrefPrefix, item),
                        name: item.name,
                        deprecated: item.deprecated,
                        standalone: item.standalone,
                        isToken: item.isToken,
                        beta: item.beta,
                        factoryKind: item.factoryKind,
                        entityType: props.type.replace(/s$/, ''),
                        selector: item.selector,
                        inputCount: item.inputsClass?.length,
                        outputCount: item.outputsClass?.length,
                        description: item.description
                    })
                )}
            </ul>
        </li>
    ) as string;
};

/**
 * A collapsible chapter section with hierarchical folder grouping.
 */
const EntitySection = (props: {
    items: any[];
    categorized?: Record<string, any[]>;
    type: string;
    iconHtml: string;
    labelKey: string;
    hrefPrefix: string;
    groupDepth?: number;
}): string => {
    if (!props.items?.length) {
        return '';
    }
    const id = `${props.type}-links`;
    const hasCats = props.categorized && Object.keys(props.categorized).length > 0;
    const groupDepth = props.groupDepth ?? 2;

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
                {chevron()}
            </button>
            <ul class={`links collapse${isToggled(props.type) ? ' in' : ''}`} id={id}>
                {hasCats
                    ? (() => {
                          const tree = buildGroupTree(props.categorized!);
                          const groupedNames = new Set(
                              Object.values(props.categorized!)
                                  .flat()
                                  .map((i: any) => i.name)
                          );
                          const ungrouped = props.items.filter(i => !groupedNames.has(i.name));
                          return (
                              <>
                                  {tree.map(node =>
                                      GroupTree({
                                          node,
                                          type: props.type,
                                          hrefPrefix: props.hrefPrefix,
                                          depth: 0,
                                          groupDepth
                                      })
                                  )}
                                  {ungrouped.map(item =>
                                      EntityLink({
                                          href: entityHref(props.hrefPrefix, item),
                                          name: item.name,
                                          deprecated: item.deprecated,
                                          standalone: item.standalone,
                                          isToken: item.isToken,
                                          beta: item.beta,
                                          factoryKind: item.factoryKind,
                                          entityType: props.type.replace(/s$/, ''),
                                          selector: item.selector,
                                          inputCount: item.inputsClass?.length,
                                          outputCount: item.outputsClass?.length,
                                          description: item.description
                                      })
                                  )}
                              </>
                          );
                      })()
                    : props.items.map(item =>
                          EntityLink({
                              href: entityHref(props.hrefPrefix, item),
                              name: item.name,
                              deprecated: item.deprecated,
                              standalone: item.standalone,
                              isToken: item.isToken,
                              beta: item.beta,
                              factoryKind: item.factoryKind,
                              entityType: props.type.replace(/s$/, ''),
                              selector: item.selector,
                              inputCount: item.inputsClass?.length,
                              outputCount: item.outputsClass?.length,
                              description: item.description
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
    if (!props.items?.length) {
        return '';
    }
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
                {chevron()}
            </button>
            <ul class="links collapse" id={id}>
                {props.items.map((item: any) =>
                    EntityLink({
                        href: entityHref(props.hrefPrefix, item),
                        name: item.name,
                        deprecated: item.deprecated,
                        context: 'sub-entity',
                        contextId: 'modules',
                        entityType: props.type.replace(/s$/, ''),
                        selector: item.selector,
                        inputCount: item.inputsClass?.length,
                        outputCount: item.outputsClass?.length,
                        description: item.description
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
                            {chevron()}
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
                                            {/* biome-ignore lint/a11y/useFocusableInteractive: Bootstrap collapse toggle wired to data-cdx-toggle */}
                                            {/* biome-ignore lint/a11y/useSemanticElements: Bootstrap collapse toggle wired to data-cdx-toggle */}
                                            <div
                                                class="menu-toggler linked"
                                                role="button"
                                                data-cdx-toggle="collapse"
                                                data-cdx-target={`#additional-page-${page.id}`}
                                                aria-expanded="false"
                                                aria-controls={`additional-page-${page.id}`}
                                            >
                                                <span class="link-name">{page.name}</span>
                                                {IconChevronRight('cdx-chevron')}
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
                            {/* biome-ignore lint/a11y/useFocusableInteractive: Bootstrap collapse toggle wired to data-cdx-toggle */}
                            {/* biome-ignore lint/a11y/useSemanticElements: Bootstrap collapse toggle wired to data-cdx-toggle */}
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
                                {chevron()}
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
                                        class={mod.deprecated ? 'cdx-member-name--deprecated' : ''}
                                    >
                                        {mod.name}
                                        {mod.deprecated
                                            ? Badge({
                                                  label: 'D',
                                                  cssClass: 'cdx-badge--deprecated'
                                              })
                                            : ''}
                                    </a>
                                    {ModuleSubSection({
                                        items: mod.compodocxLinks?.components,
                                        type: 'components',
                                        iconHtml: IconComponent(),
                                        labelKey: 'components',
                                        hrefPrefix: 'components',
                                        moduleId: mod.id
                                    })}
                                    {ModuleSubSection({
                                        items: mod.compodocxLinks?.directives,
                                        type: 'directives',
                                        iconHtml: IconDirective(),
                                        labelKey: 'directives',
                                        hrefPrefix: 'directives',
                                        moduleId: mod.id
                                    })}
                                    {ModuleSubSection({
                                        items: mod.compodocxLinks?.injectables,
                                        type: 'injectables',
                                        iconHtml: IconInjectable(),
                                        labelKey: 'injectables',
                                        hrefPrefix: 'injectables',
                                        moduleId: mod.id
                                    })}
                                    {ModuleSubSection({
                                        items: mod.compodocxLinks?.pipes,
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
                        hrefPrefix: 'components',
                        groupDepth: d.groupDepth
                    })}
                {aloneEntities.length > 0 &&
                    EntitySection({
                        items: aloneEntities,
                        type: 'entities',
                        iconHtml: IconEntity(),
                        labelKey: 'entities',
                        hrefPrefix: 'entities',
                        groupDepth: d.groupDepth
                    })}
                {aloneDirectives.length > 0 &&
                    EntitySection({
                        items: aloneDirectives,
                        categorized: d.categorizedDirectives,
                        type: 'directives',
                        iconHtml: IconDirective(),
                        labelKey: 'directives',
                        hrefPrefix: 'directives',
                        groupDepth: d.groupDepth
                    })}
                {d.classes?.length > 0 &&
                    EntitySection({
                        items: d.classes,
                        categorized: d.categorizedClasses,
                        type: 'classes',
                        iconHtml: IconClass(),
                        labelKey: 'classes',
                        hrefPrefix: 'classes',
                        groupDepth: d.groupDepth
                    })}
                {aloneInjectables.length > 0 &&
                    EntitySection({
                        items: aloneInjectables,
                        categorized: d.categorizedInjectables,
                        type: 'injectables',
                        iconHtml: IconInjectable(),
                        labelKey: 'injectables',
                        hrefPrefix: 'injectables',
                        groupDepth: d.groupDepth
                    })}
                {d.interceptors?.length > 0 &&
                    EntitySection({
                        items: d.interceptors,
                        categorized: d.categorizedInterceptors,
                        type: 'interceptors',
                        iconHtml: IconInterceptor(),
                        labelKey: 'interceptors',
                        hrefPrefix: 'interceptors',
                        groupDepth: d.groupDepth
                    })}
                {d.guards?.length > 0 &&
                    EntitySection({
                        items: d.guards,
                        categorized: d.categorizedGuards,
                        type: 'guards',
                        iconHtml: IconGuard(),
                        labelKey: 'guards',
                        hrefPrefix: 'guards',
                        groupDepth: d.groupDepth
                    })}
                {d.interfaces?.length > 0 &&
                    EntitySection({
                        items: d.interfaces,
                        categorized: d.categorizedInterfaces,
                        type: 'interfaces',
                        iconHtml: IconInterface(),
                        labelKey: 'interfaces',
                        hrefPrefix: 'interfaces',
                        groupDepth: d.groupDepth
                    })}
                {alonePipes.length > 0 &&
                    EntitySection({
                        items: alonePipes,
                        categorized: d.categorizedPipes,
                        type: 'pipes',
                        iconHtml: IconPipe(),
                        labelKey: 'pipes',
                        hrefPrefix: 'pipes',
                        groupDepth: d.groupDepth
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
                            {chevron()}
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
                                        class="cdx-logo-img"
                                        data-type="compodoc-logo"
                                        alt="Compodoc logo"
                                    />
                                ) : (
                                    <img
                                        data-src="images/compodoc-vectorise.png"
                                        class="cdx-logo-img"
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
