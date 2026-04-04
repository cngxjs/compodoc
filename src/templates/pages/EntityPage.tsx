import Html from '@kitajs/html';
import {
    extractJsdocCodeExamples,
    isInfoSection,
    isTabEnabled,
    linkTypeHtml,
    parseDescription,
    t
} from '../helpers';
import { BlockAccessors } from '../blocks/BlockAccessors';
import { BlockConstructor } from '../blocks/BlockConstructor';
import { BlockHostListener } from '../blocks/BlockHostListener';
import { BlockIndex } from '../blocks/BlockIndex';
import { BlockIndexSignatures } from '../blocks/BlockIndexSignatures';
import { BlockInput } from '../blocks/BlockInput';
import { BlockMethod } from '../blocks/BlockMethod';
import { BlockOutput } from '../blocks/BlockOutput';
import { BlockProperty } from '../blocks/BlockProperty';
import { EntityTabs } from '../blocks/EntityTabs';
import { EmptyState } from '../components/EmptyState';
import { EmptyIconDocument } from '../components/EmptyStateIcons';
import {
    IconComponent, IconDirective, IconPipe, IconModule, IconClass,
    IconInterface, IconGuard, IconInterceptor, IconInjectable, IconEntity
} from '../components/Icons';

/** Map entity key to CSS color variable, badge class, and watermark icon */
const entityMeta: Record<string, { color: string; badge: string; label: string; icon: () => string }> = {
    component:   { color: 'var(--color-cdx-entity-component)',   badge: 'cdx-badge--entity-component',   label: 'Component',   icon: IconComponent },
    directive:   { color: 'var(--color-cdx-entity-directive)',   badge: 'cdx-badge--entity-directive',   label: 'Directive',   icon: IconDirective },
    pipe:        { color: 'var(--color-cdx-entity-pipe)',        badge: 'cdx-badge--entity-pipe',        label: 'Pipe',        icon: IconPipe },
    module:      { color: 'var(--color-cdx-entity-module)',      badge: 'cdx-badge--entity-module',      label: 'Module',      icon: IconModule },
    class:       { color: 'var(--color-cdx-entity-class)',       badge: 'cdx-badge--entity-class',       label: 'Class',       icon: IconClass },
    classe:      { color: 'var(--color-cdx-entity-class)',       badge: 'cdx-badge--entity-class',       label: 'Class',       icon: IconClass },
    interface:   { color: 'var(--color-cdx-entity-interface)',   badge: 'cdx-badge--entity-interface',   label: 'Interface',   icon: IconInterface },
    guard:       { color: 'var(--color-cdx-entity-guard)',       badge: 'cdx-badge--entity-guard',       label: 'Guard',       icon: IconGuard },
    interceptor: { color: 'var(--color-cdx-entity-interceptor)', badge: 'cdx-badge--entity-interceptor', label: 'Interceptor', icon: IconInterceptor },
    injectable:  { color: 'var(--color-cdx-entity-service)',     badge: 'cdx-badge--entity-injectable',  label: 'Injectable',  icon: IconInjectable },
    entity:      { color: 'var(--color-cdx-entity-class)',       badge: 'cdx-badge--entity-class',       label: 'Entity',      icon: IconEntity },
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

const InfoContent = (props: EntityInfoProps): string => {
    const e = props.entity;

    if (!hasMembers(e)) {
        return (
            <>
                {isInfoSection('file') && !props.disableFilePath && (
                    <>
                        <p class="comment">
                            <h3>{t('file')}</h3>
                        </p>
                        <p class="comment">
                            <code>{e.file}</code>
                        </p>
                    </>
                )}
                {EmptyState({
                    icon: EmptyIconDocument(),
                    title: t('empty-entity-title'),
                    description: t('empty-entity-desc', { entityType: t(props.entityKey) }),
                    variant: 'page'
                })}
            </>
        ) as string;
    }

    return (
        <>
            {isInfoSection('file') && !props.disableFilePath && (
                <>
                    <p class="comment">
                        <h3>{t('file')}</h3>
                    </p>
                    <p class="comment">
                        <code>{e.file}</code>
                    </p>
                </>
            )}

            {isInfoSection('deprecated') && e.deprecated && (
                <>
                    <p class="comment">
                        <h3 class="deprecated">{t('deprecated')}</h3>
                    </p>
                    <p class="comment">{e.deprecationMessage}</p>
                </>
            )}

            {isInfoSection('description') && e.description && (
                <>
                    <p class="comment">
                        <h3>{t('description')}</h3>
                    </p>
                    <p class="comment">{parseDescription(e.description, props.depth)}</p>
                </>
            )}

            {isInfoSection('extends') && props.showExtends !== false && e.extends?.length > 0 && (
                <>
                    <p class="comment">
                        <h3>{t('extends')}</h3>
                    </p>
                    <p class="comment">
                        {(e.extends as string[]).map(ext => linkTypeHtml(ext)).join(' ')}
                    </p>
                </>
            )}

            {isInfoSection('extends') &&
                props.showExtends !== false &&
                e.implements?.length > 0 && (
                    <>
                        <p class="comment">
                            <h3>{t('implements')}</h3>
                        </p>
                        <p class="comment">
                            {(e.implements as string[]).map(impl => linkTypeHtml(impl)).join(' ')}
                        </p>
                    </>
                )}

            {isInfoSection('examples') &&
                e.jsdoctags &&
                (() => {
                    const examples = extractJsdocCodeExamples(e.jsdoctags);
                    if (examples.length === 0) return '';
                    return (
                        <>
                            <p class="comment">
                                <h3>{t('example')}</h3>
                            </p>
                            <div class="io-description">
                                {examples.map(ex => (
                                    <div>{ex.comment}</div>
                                ))}
                            </div>
                        </>
                    );
                })()}

            {props.metadataHtml}

            {isInfoSection('index') &&
                props.showIndex !== false &&
                BlockIndex({
                    properties: e.propertiesClass ?? e.properties,
                    methods: e.methodsClass ?? e.methods,
                    inputs: e.inputsClass,
                    outputs: e.outputsClass,
                    hostBindings: e.hostBindings,
                    hostListeners: e.hostListeners,
                    accessors: e.accessors
                })}

            {isInfoSection('constructor') &&
                props.showConstructor !== false &&
                e.constructorObj &&
                BlockConstructor({
                    constructor: e.constructorObj,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs,
                    entityColor: props.entityKey === 'classe' ? 'class' : props.entityKey
                })}

            {isInfoSection('inputs') &&
                props.showInputs !== false &&
                e.inputsClass?.length > 0 &&
                BlockInput({
                    element: e,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs,
                    entityColor: props.entityKey === 'classe' ? 'class' : props.entityKey
                })}

            {isInfoSection('outputs') &&
                props.showOutputs !== false &&
                e.outputsClass?.length > 0 &&
                BlockOutput({
                    element: e,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs,
                    entityColor: props.entityKey === 'classe' ? 'class' : props.entityKey
                })}

            {isInfoSection('hostBindings') &&
                props.showHostBindings !== false &&
                e.hostBindings?.length > 0 &&
                BlockProperty({
                    properties: e.hostBindings,
                    file: e.file,
                    title: 'HostBindings',
                    depth: props.depth,
                    navTabs: props.navTabs,
                    entityColor: props.entityKey === 'classe' ? 'class' : props.entityKey
                })}

            {isInfoSection('hostListeners') &&
                props.showHostListeners !== false &&
                e.hostListeners?.length > 0 &&
                BlockHostListener({
                    methods: e.hostListeners,
                    file: e.file,
                    title: 'HostListeners',
                    depth: props.depth,
                    navTabs: props.navTabs,
                    entityColor: props.entityKey === 'classe' ? 'class' : props.entityKey
                })}

            {isInfoSection('methods') &&
                props.showMethods !== false &&
                (e.methodsClass ?? e.methods)?.length > 0 &&
                BlockMethod({
                    methods: e.methodsClass ?? e.methods,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs,
                    entityColor: props.entityKey === 'classe' ? 'class' : props.entityKey
                })}

            {isInfoSection('properties') &&
                props.showProperties !== false &&
                (e.propertiesClass ?? e.properties)?.length > 0 &&
                BlockProperty({
                    properties: e.propertiesClass ?? e.properties,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs,
                    entityColor: props.entityKey === 'classe' ? 'class' : props.entityKey
                })}

            {isInfoSection('indexSignatures') &&
                props.showIndexSignatures !== false &&
                e.indexSignatures?.length > 0 &&
                BlockIndexSignatures({
                    indexables: e.indexSignatures,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs
                })}

            {isInfoSection('accessors') &&
                props.showAccessors !== false &&
                e.accessors &&
                Object.keys(e.accessors).length > 0 &&
                BlockAccessors({
                    accessors: e.accessors,
                    file: e.file,
                    depth: props.depth,
                    navTabs: props.navTabs,
                    entityColor: props.entityKey === 'classe' ? 'class' : props.entityKey
                })}
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
                <div class="cdx-entity-hero-watermark" aria-hidden="true">{meta.icon()}</div>
                <nav aria-label="Breadcrumb">
                    <ol class="cdx-breadcrumb">
                        <li>
                            <a
                                href={`${t(props.breadcrumbLabel).toLowerCase().replaceAll(/\s+/g, '-')}.html`}
                            >
                                {t(props.breadcrumbLabel)}
                            </a>
                        </li>
                        <li aria-current="page">{e.name}</li>
                    </ol>
                </nav>
                <h1 class="cdx-entity-hero-name">
                    <span class={e.deprecated ? 'deprecated-name' : ''}>{e.name}</span>
                </h1>
                <div class="cdx-entity-hero-badges">
                    <span class={`cdx-badge ${meta.badge}`}>{meta.label}</span>
                    {props.showStandaloneBadge && e.standalone ? <span class="cdx-badge cdx-badge--standalone">Standalone</span> : ''}
                    {props.showTokenBadge && e.isToken ? <span class="cdx-badge cdx-badge--token">Token</span> : ''}
                    {props.showJsdocBadges && e.beta ? <span class="cdx-badge cdx-badge--beta">Beta</span> : ''}
                    {props.showJsdocBadges && e.since ? <span class="cdx-badge cdx-badge--since">v{e.since}</span> : ''}
                    {props.showJsdocBadges && e.breaking ? <span class="cdx-badge cdx-badge--breaking">Breaking {e.breaking}</span> : ''}
                </div>
                {props.contextLine ? (
                    <p class="cdx-entity-hero-context">{props.contextLine}</p>
                ) : (
                    ''
                )}
            </div>
            {EntityTabs({
                navTabs: props.navTabs,
                infoContent: InfoContent(props),
                readme: e.readme,
                sourceCode: e.sourceCode,
                exampleUrls: e.exampleUrls
            })}
        </>
    ) as string;
};
