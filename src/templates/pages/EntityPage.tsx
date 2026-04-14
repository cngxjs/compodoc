import Html from '@kitajs/html';
import Configuration from '../../app/configuration';
import { BlockAccessors } from '../blocks/BlockAccessors';
import { resolveImportPath } from '../helpers/import-resolver';
import { BlockDerivedState } from '../blocks/BlockDerivedState';
import { BlockHostBindings } from '../blocks/BlockHostBindings';
import { BlockHostListener } from '../blocks/BlockHostListener';
import { BlockHostListeners } from '../blocks/BlockHostListeners';
import { BlockIndex } from '../blocks/BlockIndex';
import { BlockIndexSignatures } from '../blocks/BlockIndexSignatures';
import { BlockInput } from '../blocks/BlockInput';
import { BlockMethod } from '../blocks/BlockMethod';
import { BlockOutput } from '../blocks/BlockOutput';
import { BlockProperty } from '../blocks/BlockProperty';
import { BlockRelationshipGraph } from '../blocks/BlockRelationshipGraph';
import { EntityTabs } from '../blocks/EntityTabs';
import { ExternalLinks } from '../blocks/ExternalLinks';
import { JsdocExamplesBlock } from '../blocks/JsdocExamplesBlock';
import { RouteChip } from '../blocks/RouteChip';
import { EmptyState } from '../components/EmptyState';
import { EmptyIconDocument } from '../components/EmptyStateIcons';
import {
    IconClass,
    IconComponent,
    IconDirective,
    IconEntity,
    IconFile,
    IconGuard,
    IconInjectable,
    IconInterceptor,
    IconInterface,
    IconModule,
    IconPipe
} from '../components/Icons';
import { isApiSection, isInfoSection, linkTypeHtml, parseDescription, t } from '../helpers';

/** Parse inject() modifiers from the defaultValue string. */
const parseInjectModifiers = (defaultValue: string): string[] => {
    const mods: string[] = [];
    if (!defaultValue) {
        return mods;
    }
    if (/optional\s*:\s*true/.test(defaultValue)) {
        mods.push('optional');
    }
    if (/skipSelf\s*:\s*true/.test(defaultValue)) {
        mods.push('skipSelf');
    }
    if (/self\s*:\s*true/.test(defaultValue)) {
        mods.push('self');
    }
    if (/host\s*:\s*true/.test(defaultValue)) {
        mods.push('host');
    }
    return mods;
};

/** Dependencies section merging inject() properties and constructor params. */
const DependenciesSection = (props: { injectProps: any[]; constructorArgs: any[] }): string => {
    const items: Array<{
        name: string;
        type: string;
        source: 'inject' | 'constructor';
        modifiers: string[];
    }> = [];

    for (const p of props.injectProps) {
        items.push({
            name: p.name,
            type: p.type ?? '',
            source: 'inject',
            modifiers: parseInjectModifiers(p.defaultValue ?? '')
        });
    }

    for (const arg of props.constructorArgs) {
        items.push({
            name: arg.name,
            type: arg.type ?? '',
            source: 'constructor',
            modifiers: arg.optional ? ['optional'] : []
        });
    }

    if (items.length === 0) {
        return '';
    }

    return (
        <section class="cdx-content-section" data-compodoc="block-dependencies">
            <h3 class="cdx-section-heading" id="dependencies">
                {t('dependencies')}
                <a class="cdx-member-permalink" href="#dependencies">
                    #
                </a>
            </h3>
            <div class="cdx-deps-list">
                {items.map(item => (
                    <div class="cdx-deps-item">
                        <span class="cdx-deps-name">
                            {item.type ? linkTypeHtml(item.type) : item.name}
                        </span>
                        <span class="cdx-deps-badges">
                            <span
                                class={`cdx-badge cdx-badge--${item.source === 'inject' ? 'inject' : 'constructor-di'}`}
                            >
                                {item.source === 'inject' ? 'inject()' : 'constructor'}
                            </span>
                            {item.modifiers.map(mod => (
                                <span class="cdx-member-modifier">{mod}</span>
                            ))}
                        </span>
                        {item.source === 'inject' && item.name && (
                            <span class="cdx-deps-alias">{item.name}</span>
                        )}
                    </div>
                ))}
            </div>
        </section>
    ) as string;
};

/** Map entity key to CSS color variable, badge class, and watermark icon */
const entityMeta: Record<
    string,
    { color: string; badge: string; label: string; icon: () => string }
> = {
    component: {
        color: 'var(--color-cdx-entity-component)',
        badge: 'cdx-badge--entity-component',
        label: 'Component',
        icon: IconComponent
    },
    directive: {
        color: 'var(--color-cdx-entity-directive)',
        badge: 'cdx-badge--entity-directive',
        label: 'Directive',
        icon: IconDirective
    },
    pipe: {
        color: 'var(--color-cdx-entity-pipe)',
        badge: 'cdx-badge--entity-pipe',
        label: 'Pipe',
        icon: IconPipe
    },
    module: {
        color: 'var(--color-cdx-entity-module)',
        badge: 'cdx-badge--entity-module',
        label: 'Module',
        icon: IconModule
    },
    class: {
        color: 'var(--color-cdx-entity-class)',
        badge: 'cdx-badge--entity-class',
        label: 'Class',
        icon: IconClass
    },
    classe: {
        color: 'var(--color-cdx-entity-class)',
        badge: 'cdx-badge--entity-class',
        label: 'Class',
        icon: IconClass
    },
    interface: {
        color: 'var(--color-cdx-entity-interface)',
        badge: 'cdx-badge--entity-interface',
        label: 'Interface',
        icon: IconInterface
    },
    guard: {
        color: 'var(--color-cdx-entity-guard)',
        badge: 'cdx-badge--entity-guard',
        label: 'Guard',
        icon: IconGuard
    },
    interceptor: {
        color: 'var(--color-cdx-entity-interceptor)',
        badge: 'cdx-badge--entity-interceptor',
        label: 'Interceptor',
        icon: IconInterceptor
    },
    injectable: {
        color: 'var(--color-cdx-entity-service)',
        badge: 'cdx-badge--entity-injectable',
        label: 'Injectable',
        icon: IconInjectable
    },
    entity: {
        color: 'var(--color-cdx-entity-class)',
        badge: 'cdx-badge--entity-class',
        label: 'Entity',
        icon: IconEntity
    }
};

/**
 * Shared info-tab sections for class-like entities
 * (class, directive, injectable, guard, interceptor, pipe, entity, interface).
 */
export type EntityInfoProps = {
    readonly entity: any;
    readonly entityKey: string;
    readonly breadcrumbLabel: string;
    readonly depth: number;
    readonly navTabs: any[];
    readonly disableFilePath?: boolean;
    readonly metadataHtml?: string;
    readonly showExtends?: boolean;
    readonly showIndex?: boolean;
    readonly showConstructor?: boolean;
    readonly showInputs?: boolean;
    readonly showOutputs?: boolean;
    readonly showHostBindings?: boolean;
    readonly showHostListeners?: boolean;
    readonly showMethods?: boolean;
    readonly showProperties?: boolean;
    readonly showAccessors?: boolean;
    readonly showIndexSignatures?: boolean;
    readonly showStandaloneBadge?: boolean;
    readonly showTokenBadge?: boolean;
    readonly showJsdocBadges?: boolean;
    readonly contextLine?: string;
    readonly relationships?: {
        incoming: Array<{
            name: string;
            type: string;
            description?: string;
            subtype?: string;
        }>;
        outgoing: Array<{
            name: string;
            type: string;
            description?: string;
            subtype?: string;
        }>;
    };
};

const hasMembers = (e: any): boolean =>
    !!(
        e.constructorObj ||
        e.inputsClass?.length ||
        e.outputsClass?.length ||
        e.hostBindings?.length ||
        e.hostListeners?.length ||
        (e.methodsClass ?? e.methods)?.length ||
        (e.propertiesClass ?? e.properties)?.length ||
        e.indexSignatures?.length ||
        (e.accessors && Object.keys(e.accessors).length) ||
        e.description ||
        e.extends?.length ||
        e.implements?.length
    );

/** True when the Info tab has visible content (description, metadata, or relationships). */
const hasInfoContent = (e: any, props: EntityInfoProps): boolean =>
    !!(
        e.deprecated ||
        e.route ||
        e.description ||
        e.jsdoctags?.length ||
        props.metadataHtml ||
        e.constructorObj ||
        (e.propertiesClass ?? e.properties ?? []).some((p: any) => p.signalKind === 'inject') ||
        e.extends?.length ||
        e.implements?.length ||
        props.relationships?.incoming?.length ||
        props.relationships?.outgoing?.length
    );

/** Render extends/implements as metadata card rows for entities without decorator metadata */
const ExtendsMetadataCard = (e: any): string => {
    const hasExtends = e.extends?.length > 0;
    const hasImplements = e.implements?.length > 0;
    if (!hasExtends && !hasImplements) {
        return '';
    }

    return (
        <section class="cdx-content-section" data-compodoc="block-metadata">
            <h3 class="cdx-section-heading" id="metadata">
                {t('metadata')}
                <a class="cdx-member-permalink" href="#metadata">
                    #
                </a>
            </h3>
            <dl class="cdx-metadata-card">
                {hasExtends && (
                    <div class="cdx-metadata-row">
                        <dt class="cdx-metadata-label">extends</dt>
                        <dd class="cdx-metadata-value">
                            {(e.extends as string[]).map(ext => linkTypeHtml(ext)).join(' ')}
                        </dd>
                    </div>
                )}
                {hasImplements && (
                    <div class="cdx-metadata-row">
                        <dt class="cdx-metadata-label">implements</dt>
                        <dd class="cdx-metadata-value">
                            {(e.implements as string[]).map(impl => linkTypeHtml(impl)).join(' ')}
                        </dd>
                    </div>
                )}
            </dl>
        </section>
    ) as string;
};

/**
 * Overview-style content for class-like entities: description, examples,
 * external links, metadata, relationships. Lives on the **Info** tab.
 * Member surface (inputs/outputs/methods/...) lives in {@link ApiContent}.
 *
 * When the entity has no meaningful content at all, returns a page-level
 * empty state instead.
 */
const InfoContent = (props: EntityInfoProps): string => {
    const e = props.entity;

    if (!hasMembers(e)) {
        return EmptyState({
            icon: EmptyIconDocument(),
            title: t('empty-entity-title'),
            description: t('empty-entity-desc', { entityType: t(props.entityKey) }),
            variant: 'full'
        }) as string;
    }

    if (!hasInfoContent(e, props)) {
        return EmptyState({
            icon: EmptyIconDocument(),
            title: t('no-overview'),
            description: t('no-overview-desc'),
            variant: 'full'
        }) as string;
    }

    return (
        <>
            {/* 0. Import statement */}
            {isInfoSection('import') &&
                (() => {
                    const importPath = resolveImportPath(e.file);
                    return importPath
                        ? `<section class="cdx-content-section"><h3 class="cdx-section-heading" id="import">${t('import')}<a class="cdx-member-permalink" href="#import">#</a></h3><p class="cdx-import-line"><span class="cdx-import-kw">import</span> { <span class="cdx-import-name">${e.name}</span> } <span class="cdx-import-kw">from</span> <span class="cdx-import-str">'${importPath}'</span></p></section>`
                        : '';
                })()}

            {/* 1. Deprecation banner */}
            {isInfoSection('deprecated') && e.deprecated && (
                <div class="cdx-deprecation-banner" role="alert">
                    <strong>{t('deprecated')}</strong>
                    <span>{e.deprecationMessage}</span>
                </div>
            )}

            {/* 2. Route chip (above description) */}
            {RouteChip({ route: e.route })}

            {/* 3. Description */}
            {isInfoSection('description') && e.description && (
                <section class="cdx-content-section">
                    <h3 class="cdx-section-heading" id="description">
                        {t('description')}
                        <a class="cdx-member-permalink" href="#description">
                            #
                        </a>
                    </h3>
                    <div class="cdx-prose">{parseDescription(e.description, props.depth)}</div>
                </section>
            )}

            {/* 3. Examples */}
            {isInfoSection('examples') &&
                e.jsdoctags &&
                JsdocExamplesBlock({ tags: e.jsdoctags, variant: 'code', level: 'section' })}

            {/* 4. Metadata (from entity-specific page) or extends/implements card */}
            {isInfoSection('metadata') &&
                (props.metadataHtml
                    ? props.metadataHtml
                    : isInfoSection('extends') && props.showExtends !== false
                      ? ExtendsMetadataCard(e)
                      : '')}

            {/* 4b. Dependencies (inject() + constructor merged) */}
            {isInfoSection('dependencies') &&
                (() => {
                    const allProps = e.propertiesClass ?? e.properties ?? [];
                    const injectProps = allProps.filter((p: any) => p.signalKind === 'inject');
                    const ctorArgs = e.constructorObj?.args ?? [];
                    if (injectProps.length === 0 && ctorArgs.length === 0) {
                        return '';
                    }
                    return DependenciesSection({ injectProps, constructorArgs: ctorArgs });
                })()}

            {/* 4.5 Relationships (cross-linking) */}
            {isInfoSection('relationships') &&
                props.relationships &&
                (props.relationships.incoming?.length > 0 ||
                    props.relationships.outgoing?.length > 0) &&
                BlockRelationshipGraph({
                    incoming: props.relationships.incoming,
                    outgoing: props.relationships.outgoing,
                    entityName: e.name
                })}
        </>
    ) as string;
};

/**
 * Member surface for class-like entities: index, constructor, inputs, outputs,
 * host bindings/listeners, methods, properties, index signatures, accessors.
 * Lives on the **API** tab.
 */
const ApiContent = (props: EntityInfoProps): string => {
    const e = props.entity;
    const allProps: any[] = e.propertiesClass ?? e.properties ?? [];
    const allSignalProps: any[] = [
        ...(e.inputsClass ?? []),
        ...(e.outputsClass ?? []),
        ...allProps
    ];
    const derivedProps = allProps.filter(
        (p: any) => p.signalKind === 'computed' || p.signalKind === 'linked-signal'
    );
    const regularProps = allProps.filter(
        (p: any) =>
            p.signalKind !== 'computed' &&
            p.signalKind !== 'linked-signal' &&
            p.signalKind !== 'inject'
    );

    return (
        <>
            {/* 5. Index */}
            {isApiSection('index') &&
                props.showIndex !== false &&
                BlockIndex({
                    properties: regularProps,
                    methods: e.methodsClass ?? e.methods,
                    inputs: e.inputsClass,
                    outputs: e.outputsClass,
                    derivedState: derivedProps,
                    hostBindings: e.hostBindings,
                    hostListeners: e.hostListeners,
                    accessors: e.accessors,
                    indexSignatures: e.indexSignatures
                })}

            {/* 7. Inputs */}
            {isApiSection('inputs') &&
                props.showInputs !== false &&
                e.inputsClass?.length > 0 &&
                BlockInput({
                    element: e,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs
                })}

            {/* 8. Outputs */}
            {isApiSection('outputs') &&
                props.showOutputs !== false &&
                e.outputsClass?.length > 0 &&
                BlockOutput({
                    element: e,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs
                })}

            {/* 8b. Derived State */}
            {isApiSection('derivedState') &&
                derivedProps.length > 0 &&
                BlockDerivedState({
                    properties: derivedProps,
                    allSignalProps,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs
                })}

            {/* 9. Properties */}
            {isApiSection('properties') &&
                props.showProperties !== false &&
                regularProps.length > 0 &&
                BlockProperty({
                    properties: regularProps,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs
                })}

            {/* 10. Methods */}
            {isApiSection('methods') &&
                props.showMethods !== false &&
                (e.methodsClass ?? e.methods)?.length > 0 &&
                BlockMethod({
                    methods: e.methodsClass ?? e.methods,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs
                })}

            {/* 13. Index Signatures */}
            {isApiSection('indexSignatures') &&
                props.showIndexSignatures !== false &&
                e.indexSignatures?.length > 0 &&
                BlockIndexSignatures({
                    indexables: e.indexSignatures,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs
                })}

            {/* 14. Accessors */}
            {isApiSection('accessors') &&
                props.showAccessors !== false &&
                e.accessors &&
                Object.keys(e.accessors).length > 0 &&
                BlockAccessors({
                    accessors: e.accessors,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs
                })}

            {/* 15. Host Bindings */}
            {isApiSection('hostBindings') &&
                props.showHostBindings !== false &&
                e.hostBindings?.length > 0 &&
                BlockHostBindings({ bindings: e.hostBindings })}

            {/* 16. Host Listeners */}
            {isApiSection('hostListeners') &&
                props.showHostListeners !== false &&
                e.hostListeners?.length > 0 &&
                BlockHostListeners({ listeners: e.hostListeners })}
        </>
    ) as string;
};

/** Generic entity detail page renderer. */
export const renderEntityPage = (props: EntityInfoProps): string => {
    const meta = entityMeta[props.entityKey] ?? entityMeta['entity'];
    const e = props.entity;

    return (
        <>
            <div class="cdx-entity-hero" style={`--cdx-hero-color: ${meta.color}`}>
                <div class="cdx-entity-hero-watermark" aria-hidden="true">
                    {meta.icon()}
                </div>
                <nav aria-label="Breadcrumb">
                    <ol class="cdx-breadcrumb">
                        <li>{t(props.breadcrumbLabel)}</li>
                        <li aria-current="page">{e.name}</li>
                    </ol>
                </nav>
                <h1 class="cdx-entity-hero-name">
                    <span class={e.deprecated ? 'cdx-member-name--deprecated' : ''}>{e.name}</span>
                </h1>
                <div class="cdx-entity-hero-badges">
                    <span class={`cdx-badge ${meta.badge}`}>{meta.label}</span>
                    {props.showStandaloneBadge &&
                    e.standalone &&
                    Configuration.mainData.hasNgModules ? (
                        <span class="cdx-badge cdx-badge--standalone">Standalone</span>
                    ) : (
                        ''
                    )}
                    {props.showTokenBadge && e.isToken ? (
                        <span class="cdx-badge cdx-badge--token">Token</span>
                    ) : (
                        ''
                    )}
                    {props.showJsdocBadges && e.beta ? (
                        <span class="cdx-badge cdx-badge--beta">Beta</span>
                    ) : (
                        ''
                    )}
                    {props.showJsdocBadges && e.since ? (
                        <span class="cdx-badge cdx-badge--since">v{e.since}</span>
                    ) : (
                        ''
                    )}
                    {props.showJsdocBadges && e.breaking ? (
                        <span class="cdx-badge cdx-badge--breaking">Breaking {e.breaking}</span>
                    ) : (
                        ''
                    )}
                </div>
                {props.contextLine ? (
                    <p class="cdx-entity-hero-context">{props.contextLine}</p>
                ) : (
                    ''
                )}
                {!props.disableFilePath && e.file && (
                    <p class="cdx-entity-hero-file" title="Source file" aria-label="Source file">
                        {IconFile()}
                        <span>{e.file}</span>
                    </p>
                )}
                {ExternalLinks({
                    storybookUrl: e.storybookUrl,
                    figmaUrl: e.figmaUrl,
                    stackblitzUrl: e.stackblitzUrl,
                    githubUrl: e.githubUrl,
                    docsUrl: e.docsUrl
                })}
            </div>
            {EntityTabs({
                navTabs: props.navTabs,
                infoContent: InfoContent(props),
                apiContent: ApiContent(props),
                readme: e.readme,
                sourceCode: e.sourceCode,
                filePath: e.file,
                exampleUrls: e.exampleUrls
            })}
        </>
    ) as string;
};
