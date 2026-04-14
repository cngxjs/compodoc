import Html from '@kitajs/html';
import Configuration from '../../app/configuration';
import { BlockAccessors } from '../blocks/BlockAccessors';
import { resolveImportPath } from '../helpers/import-resolver';
import { BlockDerivedState } from '../blocks/BlockDerivedState';
import { BlockHostBindings } from '../blocks/BlockHostBindings';
import { BlockHostListeners } from '../blocks/BlockHostListeners';
import { BlockIndex } from '../blocks/BlockIndex';
import { BlockInput } from '../blocks/BlockInput';
import { BlockMethod } from '../blocks/BlockMethod';
import { BlockOutput } from '../blocks/BlockOutput';
import { BlockProperty } from '../blocks/BlockProperty';
import { BlockRelationshipGraph } from '../blocks/BlockRelationshipGraph';
import { ExternalLinks } from '../blocks/ExternalLinks';
import { DEPENDENCY_LEGEND_ITEMS, GraphLegend, GraphZoomControls } from '../blocks/GraphControls';
import { JsdocExamplesBlock } from '../blocks/JsdocExamplesBlock';
import {
    MetadataChipsRow,
    MetadataCodeRow,
    MetadataHostDirectivesRow,
    MetadataSection
} from '../blocks/MetadataRow';
import { RouteChip } from '../blocks/RouteChip';
import { SourceViewer } from '../blocks/SourceViewer';
import { EmptyState } from '../components/EmptyState';
import {
    EmptyIconBook,
    EmptyIconDocument,
    EmptyIconHtml,
    EmptyIconPalette,
    EmptyIconTree
} from '../components/EmptyStateIcons';
import { IconComponent, IconFile } from '../components/Icons';
import {
    extractReadmeHeadings,
    isApiSection,
    isInfoSection,
    isInitialTab,
    isReadmeEmpty,
    isTabEnabled,
    linkTypeHtml,
    parseDescription,
    relativeUrl,
    t
} from '../helpers';

const escapeSimpleQuote = (text: string): string => {
    if (!text) {
        return '';
    }
    return text.replaceAll("'", String.raw`\'`).replaceAll(/(\r\n|\n|\r)/gm, '');
};

const breakComma = (text: string): string => {
    const escaped = String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll(/"/g, '&quot;');
    return escaped.replaceAll(',', ',<br>');
};

/** Standalone section for host configuration (hostStructured) as grouped table. */
const HostSection = (entries: any[]): string => {
    if (!entries?.length) {
        return '';
    }
    // Filter bare class-only
    const meaningful = entries.filter(
        (e: any) => !(e.kind === 'static' && e.key === 'class' && entries.length === 1)
    );
    if (meaningful.length === 0) {
        return '';
    }

    const esc = (s: string) =>
        s.replace(
            /[&<>]/g,
            (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string
        );

    // Group by category
    const staticClass = meaningful.filter((e: any) => e.kind === 'static' && e.key === 'class');
    const staticAttrs = meaningful.filter((e: any) => e.kind === 'static' && e.key !== 'class');
    const boundAttrs = meaningful.filter(
        (e: any) => e.kind === 'attr-binding' || e.kind === 'property-binding'
    );
    const boundClasses = meaningful.filter((e: any) => e.kind === 'class-binding');
    const boundStyles = meaningful.filter((e: any) => e.kind === 'style-binding');
    const events = meaningful.filter((e: any) => e.kind === 'event');

    // Strip decorator brackets/parens from keys
    const stripKey = (key: string): string => {
        // [class.is-dirty] → is-dirty
        // [attr.aria-label] → keep as-is (stays in static attrs)
        // (document:keydown.escape) → document:keydown.escape
        if (key.startsWith('(') && key.endsWith(')')) {
            return key.slice(1, -1);
        }
        if (key.startsWith('[class.') && key.endsWith(']')) {
            return key.slice(7, -1);
        }
        if (key.startsWith('[style.') && key.endsWith(']')) {
            return key.slice(7, -1);
        }
        return key;
    };

    // Link to member identifier, strip ($event) etc from display
    const linkedRef = (value: string): string => {
        const m = /^(this\.)?([a-zA-Z_$][a-zA-Z0-9_$]*)(\(.*\))?$/.exec(value);
        if (!m) {
            return `<code>${esc(value)}</code>`;
        }
        const id = m[2];
        return `<a href="#${id}">${esc(id)}</a>`;
    };

    const renderChip = (key: string, arrow: string, value: string): string =>
        `<span class="cdx-host-chip">${esc(stripKey(key))} ${arrow} ${linkedRef(value)}</span>`;

    const rows: string[] = [];
    const addRow = (label: string, content: string) => {
        rows.push(
            `<div class="cdx-metadata-row"><dt class="cdx-metadata-label">${label}</dt><dd class="cdx-metadata-value">${content}</dd></div>`
        );
    };

    if (staticClass.length > 0) {
        addRow('Class', `<code>${esc(staticClass[0].value)}</code>`);
    }
    // Merge static attrs + bound attrs into one "Static attributes" group
    const allStaticAttrs = [...staticAttrs, ...boundAttrs];
    if (allStaticAttrs.length > 0) {
        const pairs = allStaticAttrs.map(
            (e: any) =>
                `<div class="cdx-host-attr-pair"><code>${esc(e.key)}</code><span class="cdx-host-val">${esc(e.value)}</span></div>`
        );
        addRow('Static attributes', `<div class="cdx-host-attr-grid">${pairs.join('')}</div>`);
    }
    if (boundClasses.length > 0) {
        const chips = boundClasses.map((e: any) => renderChip(e.key, '\u2190', e.value));
        addRow('Bound classes', chips.join(' '));
    }
    if (boundStyles.length > 0) {
        const chips = boundStyles.map((e: any) => renderChip(e.key, '\u2190', e.value));
        addRow('Bound styles', chips.join(' '));
    }
    if (events.length > 0) {
        const chips = events.map((e: any) => renderChip(e.key, '\u2192', e.value));
        addRow('Listeners', chips.join(' '));
    }

    if (rows.length === 0) {
        return '';
    }

    return (
        <section class="cdx-content-section" data-compodoc="block-host">
            <h3 class="cdx-section-heading" id="host">
                {t('host')}
                <a class="cdx-member-permalink" href="#host">
                    #
                </a>
            </h3>
            <dl class="cdx-metadata-card">{rows.join('')}</dl>
        </section>
    ) as string;
};

/** Standalone section for providers or viewProviders as 2-column grid table. */
const ProvidersSection = (props: { title: string; entries: any[] }): string => {
    if (!props.entries?.length) {
        return '';
    }

    const esc = (s: string) =>
        s.replace(
            /[&<>]/g,
            (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string
        );

    const nameLink = (name: string): string => {
        const resolved = linkTypeHtml(name);
        return resolved || esc(name);
    };

    const rows = props.entries.map((entry: any) => {
        const nameHtml = nameLink(entry.name);
        const parts: string[] = [];

        if (entry.kind === 'class') {
            parts.push('<span class="cdx-provider-strategy">useClass</span>');
        } else if (entry.kind === 'useClass' && entry.useClass) {
            parts.push(
                `<span class="cdx-provider-strategy">useClass</span> ${nameLink(entry.useClass)}`
            );
        } else if (entry.kind === 'useValue') {
            const val = entry.useValue ?? '';
            parts.push(
                `<span class="cdx-provider-strategy">useValue</span> <code>${esc(val)}</code>`
            );
        } else if (entry.kind === 'useFactory') {
            if (entry.factory) {
                parts.push(
                    `<span class="cdx-provider-strategy">useFactory</span> ${nameLink(entry.factory)}`
                );
            }
            if (entry.deps?.length) {
                parts.push(
                    `<span class="cdx-host-dir-chip">deps: ${entry.deps.map((d: string) => nameLink(d)).join(', ')}</span>`
                );
            }
        } else if (entry.kind === 'useExisting' && entry.useExisting) {
            parts.push(
                `<span class="cdx-provider-strategy">useExisting</span> ${nameLink(entry.useExisting)}`
            );
        }

        if (entry.multi) {
            parts.push('<span class="cdx-host-dir-chip">multi</span>');
        }

        const valueHtml = parts.length > 0 ? parts.join(' ') : '';
        return `<div class="cdx-provider-row"><dt class="cdx-provider-name">${nameHtml}</dt><dd class="cdx-provider-value">${valueHtml}</dd></div>`;
    });

    const headingId = props.title.toLowerCase().replace(/\s+/g, '-');
    return (
        <section class="cdx-content-section" data-compodoc="block-providers">
            <h3 class="cdx-section-heading" id={headingId}>
                {props.title}
                <a class="cdx-member-permalink" href={`#${headingId}`}>
                    #
                </a>
            </h3>
            <dl class="cdx-provider-table">{rows.join('')}</dl>
        </section>
    ) as string;
};

/**
 * Parse inject() modifiers from the defaultValue string.
 * e.g. `inject(Token, { optional: true, skipSelf: true })` -> ['optional', 'skipSelf']
 */
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
            <h3 class="cdx-section-heading" id="section-dependencies">
                {t('dependencies')}
                <a class="cdx-member-permalink" href="#section-dependencies">
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
                    </div>
                ))}
            </div>
        </section>
    ) as string;
};

const ComponentMetadata = (c: any): string => {
    if (!isInfoSection('metadata')) {
        return '';
    }

    const rows: string[] = [];
    const codeField = (label: string, value: unknown) => {
        if (value != null && value !== '' && (!Array.isArray(value) || value.length > 0)) {
            rows.push(MetadataCodeRow(label, String(value)));
        }
    };

    // Scalar source-of-truth values — kept in the table. Boolean/enum traits
    // (standalone, changeDetection, encapsulation, preserveWhitespaces) now live
    // in the hero badge row so the metadata table stays focused on substantive
    // values that actually need a value cell.
    codeField('selector', c.selector);
    codeField('exportAs', c.exportAs);
    codeField('animations', c.animations);
    codeField('interpolation', c.interpolation);
    codeField('moduleId', c.moduleId);
    codeField('queries', c.queries);
    codeField('templateUrl', c.templateUrl);
    if (c.styleUrls?.length > 0) {
        codeField('styleUrls', breakComma(c.styleUrls));
    }
    codeField('tag', c.tag);
    codeField('styleUrl', c.styleUrl);
    codeField('shadow', c.shadow);
    codeField('scoped', c.scoped);
    codeField('assetsDir', c.assetsDir);
    codeField('assetsDirs', c.assetsDirs);

    // Array values → chip rows (implements before imports to match design)
    rows.push(MetadataChipsRow('extends', (c.extends as string[]) ?? []));
    rows.push(MetadataChipsRow('implements', (c.implements as string[]) ?? []));
    rows.push(MetadataChipsRow('imports', c.imports ?? []));
    rows.push(MetadataChipsRow('entryComponents', c.entryComponents ?? []));

    // Host directives stay in core metadata (they're component config, not runtime host bindings)
    if (c.hostDirectives?.length > 0) {
        rows.push(MetadataHostDirectivesRow(c.hostDirectives));
    }

    return MetadataSection({ rows });
};

/**
 * Overview-style content rendered on the **Info** tab: description, examples,
 * external links, decorator metadata, host literal, content slots, relationships.
 * Member surface (inputs/outputs/methods/...) lives in {@link ApiContent}.
 */
const hasComponentInfoContent = (data: any): boolean => {
    const c = data.component;
    return !!(
        c.deprecated ||
        c.route ||
        c.description ||
        c.jsdoctags?.length ||
        c.selector ||
        c.constructorObj ||
        c.extends?.length ||
        c.implements?.length ||
        c.providers?.length ||
        c.viewProviders?.length ||
        c.hostDirectives?.length ||
        c.hostStructured?.length ||
        c.propertiesClass?.some((p: any) => p.signalKind === 'inject') ||
        c.slots?.length ||
        data.relationships?.incoming?.length ||
        data.relationships?.outgoing?.length
    );
};

const InfoContent = (data: any): string => {
    const c = data.component;
    const depth = data.depth;

    if (!hasComponentInfoContent(data)) {
        return EmptyState({
            icon: EmptyIconDocument(),
            title: t('no-overview'),
            description: t('no-overview-desc'),
            variant: 'full'
        }) as string;
    }

    return (
        <>
            {isInfoSection('import') &&
                (() => {
                    const importPath = resolveImportPath(c.file);
                    return importPath
                        ? `<section class="cdx-content-section"><h3 class="cdx-section-heading" id="import">${t('import')}<a class="cdx-member-permalink" href="#import">#</a></h3><p class="cdx-import-line"><span class="cdx-import-kw">import</span> { <span class="cdx-import-name">${c.name}</span> } <span class="cdx-import-kw">from</span> <span class="cdx-import-str">'${importPath}'</span></p></section>`
                        : '';
                })()}

            {isInfoSection('deprecated') && c.deprecated && (
                <div class="cdx-deprecation-banner" role="alert">
                    <strong>{t('deprecated')}</strong>
                    <span>{c.deprecationMessage}</span>
                </div>
            )}

            {RouteChip({ route: c.route })}

            {isInfoSection('description') && c.description && (
                <section class="cdx-content-section">
                    <h3 class="cdx-section-heading" id="description">
                        {t('description')}
                        <a class="cdx-member-permalink" href="#description">
                            #
                        </a>
                    </h3>
                    <div class="cdx-prose">{parseDescription(c.description, depth)}</div>
                </section>
            )}

            {isInfoSection('examples') &&
                c.jsdoctags &&
                JsdocExamplesBlock({ tags: c.jsdoctags, variant: 'code', level: 'section' })}

            {isInfoSection('metadata') && ComponentMetadata(c)}

            {isInfoSection('metadata') && c.slots?.length > 0 && (
                <section class="cdx-content-section">
                    <h3 class="cdx-section-heading" id="content-slots">
                        Content Slots
                        <a class="cdx-member-permalink" href="#content-slots">
                            #
                        </a>
                    </h3>
                    <dl class="cdx-metadata-card">
                        {c.slots.map((slot: any) => (
                            <>
                                <dt>
                                    <code>{slot.name}</code>
                                </dt>
                                <dd>{slot.description}</dd>
                            </>
                        ))}
                    </dl>
                </section>
            )}

            {isInfoSection('host') && c.hostStructured?.length > 0 && HostSection(c.hostStructured)}

            {isInfoSection('providers') &&
                c.providers?.length > 0 &&
                ProvidersSection({ title: t('providers'), entries: c.providers })}

            {isInfoSection('viewProviders') &&
                c.viewProviders?.length > 0 &&
                ProvidersSection({ title: t('view-providers'), entries: c.viewProviders })}

            {isInfoSection('dependencies') &&
                (() => {
                    const injectProps = (c.propertiesClass ?? []).filter(
                        (p: any) => p.signalKind === 'inject'
                    );
                    const ctorArgs = c.constructorObj?.args ?? [];
                    return injectProps.length > 0 || ctorArgs.length > 0
                        ? DependenciesSection({ injectProps, constructorArgs: ctorArgs })
                        : '';
                })()}

            {isInfoSection('relationships') &&
                data.relationships &&
                BlockRelationshipGraph({
                    incoming: data.relationships.incoming,
                    outgoing: data.relationships.outgoing,
                    entityName: c.name
                })}
        </>
    ) as string;
};

/**
 * Member surface rendered on the **API** tab: index, constructor, inputs,
 * outputs, host bindings/listeners, methods, properties, accessors.
 */
const ApiContent = (data: any): string => {
    const c = data.component;
    const depth = data.depth;
    const allProps: any[] = c.propertiesClass ?? [];
    const allSignalProps: any[] = [
        ...(c.inputsClass ?? []),
        ...(c.outputsClass ?? []),
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
            {isApiSection('index') &&
                BlockIndex({
                    properties: regularProps,
                    methods: c.methodsClass,
                    inputs: c.inputsClass,
                    outputs: c.outputsClass,
                    derivedState: derivedProps,
                    hostBindings: c.hostBindings,
                    hostListeners: c.hostListeners,
                    accessors: c.accessors
                })}

            {isApiSection('inputs') &&
                c.inputsClass?.length > 0 &&
                BlockInput({ element: c, file: c.file, depth, navTabs: data.navTabs })}
            {isApiSection('outputs') &&
                c.outputsClass?.length > 0 &&
                BlockOutput({ element: c, file: c.file, depth, navTabs: data.navTabs })}
            {isApiSection('derivedState') &&
                derivedProps.length > 0 &&
                BlockDerivedState({
                    properties: derivedProps,
                    allSignalProps,
                    file: c.file,
                    depth,
                    navTabs: data.navTabs
                })}
            {isApiSection('properties') &&
                regularProps.length > 0 &&
                BlockProperty({
                    properties: regularProps,
                    file: c.file,
                    depth,
                    navTabs: data.navTabs
                })}
            {isApiSection('methods') &&
                c.methodsClass?.length > 0 &&
                BlockMethod({
                    methods: c.methodsClass,
                    file: c.file,
                    depth,
                    navTabs: data.navTabs
                })}
            {isApiSection('accessors') &&
                c.accessors &&
                Object.keys(c.accessors).length > 0 &&
                BlockAccessors({
                    accessors: c.accessors,
                    file: c.file,
                    depth,
                    navTabs: data.navTabs
                })}
            {isApiSection('hostBindings') &&
                c.hostBindings?.length > 0 &&
                BlockHostBindings({ bindings: c.hostBindings })}
            {isApiSection('hostListeners') &&
                c.hostListeners?.length > 0 &&
                BlockHostListeners({ listeners: c.hostListeners })}
        </>
    ) as string;
};

export const ComponentPage = (data: any): string => {
    const c = data.component;
    const depth = data.depth;
    const base = relativeUrl(depth);
    const navTabs = data.navTabs;
    const hasStandaloneImports = c.standalone && c.imports?.length > 0;

    const componentDepGraph = hasStandaloneImports
        ? (() => {
              const allComponents = (data.components as any[]) ?? [];
              const allDirectives = (data.directives as any[]) ?? [];
              const allPipes = (data.pipes as any[]) ?? [];
              const allModules = (data.modules as any[]) ?? [];
              const allInjectables = (data.injectables as any[]) ?? [];
              const entityMap = new Map<string, { type: string; url?: string }>();
              for (const x of allComponents) {
                  entityMap.set(x.name, {
                      type: 'component',
                      url: `${base}components/${x.name}.html`
                  });
              }
              for (const x of allDirectives) {
                  entityMap.set(x.name, {
                      type: 'directive',
                      url: `${base}directives/${x.name}.html`
                  });
              }
              for (const x of allPipes) {
                  entityMap.set(x.name, { type: 'pipe', url: `${base}pipes/${x.name}.html` });
              }
              for (const x of allModules) {
                  entityMap.set(x.name, { type: 'module', url: `${base}modules/${x.name}.html` });
              }
              for (const x of allInjectables) {
                  entityMap.set(x.name, {
                      type: 'injectable',
                      url: `${base}injectables/${x.name}.html`
                  });
              }
              const nodes = [
                  { name: c.name, type: 'component', url: undefined },
                  ...c.imports.map((imp: any) => {
                      const n = typeof imp === 'string' ? imp : imp.name;
                      const info = entityMap.get(n);
                      return { name: n, type: info?.type ?? 'module', url: info?.url };
                  })
              ];
              const edges = c.imports.map((imp: any) => ({
                  source: c.name,
                  target: typeof imp === 'string' ? imp : imp.name
              }));
              return { nodes, edges };
          })()
        : null;

    return (
        <>
            <div
                class="cdx-entity-hero"
                style="--cdx-hero-color: var(--color-cdx-entity-component)"
            >
                <div class="cdx-entity-hero-watermark" aria-hidden="true">
                    {IconComponent()}
                </div>
                <nav aria-label="Breadcrumb">
                    <ol class="cdx-breadcrumb">
                        <li>{t('components')}</li>
                        <li aria-current="page">{c.name}</li>
                    </ol>
                </nav>
                <h1 class="cdx-entity-hero-name">
                    <span class={c.deprecated ? 'cdx-member-name--deprecated' : ''}>{c.name}</span>
                </h1>
                <div class="cdx-entity-hero-badges">
                    <span class="cdx-badge cdx-badge--entity-component">Component</span>
                    {c.standalone && Configuration.mainData.hasNgModules ? (
                        <span class="cdx-badge cdx-badge--standalone">Standalone</span>
                    ) : (
                        ''
                    )}
                    {c.zoneless ? <span class="cdx-badge cdx-badge--zoneless">Zoneless</span> : ''}
                    {(() => {
                        const cd = String(c.changeDetection ?? '');
                        return cd.includes('OnPush') ? (
                            <span class="cdx-badge cdx-badge--trait">OnPush</span>
                        ) : (
                            ''
                        );
                    })()}
                    {(() => {
                        const enc = Array.isArray(c.encapsulation)
                            ? c.encapsulation.join(' ')
                            : String(c.encapsulation ?? '');
                        if (enc.includes('ShadowDom')) {
                            return <span class="cdx-badge cdx-badge--trait">Shadow DOM</span>;
                        }
                        if (enc.includes('None')) {
                            return <span class="cdx-badge cdx-badge--trait">No encapsulation</span>;
                        }
                        return '';
                    })()}
                    {c.preserveWhitespaces ? (
                        <span class="cdx-badge cdx-badge--trait">Preserve whitespace</span>
                    ) : (
                        ''
                    )}
                    {c.beta ? <span class="cdx-badge cdx-badge--beta">Beta</span> : ''}
                    {c.since ? <span class="cdx-badge cdx-badge--since">v{c.since}</span> : ''}
                    {c.breaking ? (
                        <span class="cdx-badge cdx-badge--breaking">Breaking {c.breaking}</span>
                    ) : (
                        ''
                    )}
                </div>
                {!data.disableFilePath && c.file && (
                    <p class="cdx-entity-hero-file" title="Source file" aria-label="Source file">
                        {IconFile()}
                        <span>{c.file}</span>
                    </p>
                )}
                {ExternalLinks({
                    storybookUrl: c.storybookUrl,
                    figmaUrl: c.figmaUrl,
                    stackblitzUrl: c.stackblitzUrl,
                    githubUrl: c.githubUrl,
                    docsUrl: c.docsUrl
                })}
            </div>

            <ul class="cdx-tab-bar">
                {navTabs.map((tab: any, i: number) => (
                    <li role="presentation">
                        <a
                            href={tab.href}
                            class={i === 0 ? 'active' : ''}
                            role="tab"
                            id={`${tab.id}-tab`}
                            aria-selected={i === 0 ? 'true' : 'false'}
                            aria-controls={tab.id}
                            tabindex={i === 0 ? '0' : '-1'}
                            data-cdx-toggle="tab"
                            data-link={tab['data-link']}
                        >
                            {t(tab.label)}
                        </a>
                    </li>
                ))}
                {hasStandaloneImports && (
                    <li role="presentation">
                        <a
                            href="#dependencies"
                            role="tab"
                            id="dependencies-tab"
                            aria-selected="false"
                            aria-controls="dependencies"
                            tabindex="-1"
                            data-cdx-toggle="tab"
                        >
                            {t('dependencies')}
                        </a>
                    </li>
                )}
            </ul>

            <div>
                {isTabEnabled(navTabs, 'info') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'info') ? ' active' : ''}`}
                        id="info"
                        role="tabpanel"
                        aria-labelledby="info-tab"
                    >
                        {InfoContent(data)}
                    </div>
                )}

                {isTabEnabled(navTabs, 'api') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'api') ? ' active' : ''}`}
                        id="api"
                        role="tabpanel"
                        aria-labelledby="api-tab"
                    >
                        {ApiContent(data)}
                    </div>
                )}

                {isTabEnabled(navTabs, 'readme') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'readme') ? ' active' : ''}`}
                        id="readme"
                        role="tabpanel"
                        aria-labelledby="readme-tab"
                    >
                        {isReadmeEmpty(c.readme) ? (
                            <>
                                {extractReadmeHeadings(c.readme)}
                                {EmptyState({
                                    icon: EmptyIconBook(),
                                    title: t('empty-readme-title'),
                                    description: t('empty-readme-desc'),
                                    variant: 'full'
                                })}
                            </>
                        ) : (
                            <div class="cdx-readme">{c.readme}</div>
                        )}
                    </div>
                )}

                {isTabEnabled(navTabs, 'source') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'source') ? ' active' : ''} cdx-tab-panel--source`}
                        id="source"
                        role="tabpanel"
                        aria-labelledby="source-tab"
                    >
                        {SourceViewer({
                            filePath: c.file,
                            sourceCode: c.sourceCode ?? '',
                            lang: 'typescript'
                        })}
                    </div>
                )}

                {isTabEnabled(navTabs, 'templateData') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'templateData') ? ' active' : ''}`}
                        id="templateData"
                        role="tabpanel"
                        aria-labelledby="templateData-tab"
                    >
                        {c.templateData?.trim()
                            ? SourceViewer({
                                  filePath: c.templateUrl?.[0],
                                  sourceCode: c.templateData,
                                  lang: 'html'
                              })
                            : EmptyState({
                                  icon: EmptyIconHtml(),
                                  title: t('empty-template-title'),
                                  description: t('empty-template-desc'),
                                  variant: 'full'
                              })}
                    </div>
                )}

                {isTabEnabled(navTabs, 'styleData') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'styleData') ? ' active' : ''}`}
                        id="styleData"
                        role="tabpanel"
                        aria-labelledby="styleData-tab"
                    >
                        {c.styleUrlsData?.length > 0
                            ? c.styleUrlsData.map((s: any) =>
                                  SourceViewer({
                                      filePath: s.styleUrl,
                                      sourceCode: s.data,
                                      lang: 'scss'
                                  })
                              )
                            : ''}
                        {c.stylesData &&
                            c.stylesData !== '' &&
                            SourceViewer({
                                sourceCode: c.stylesData,
                                lang: 'scss',
                                label: 'Inline Styles'
                            })}
                        {!(c.styleUrlsData?.length > 0) &&
                            !(c.stylesData && c.stylesData !== '') &&
                            EmptyState({
                                icon: EmptyIconPalette(),
                                title: t('empty-styles-title'),
                                description: t('empty-styles-desc'),
                                variant: 'full'
                            })}
                    </div>
                )}

                {isTabEnabled(navTabs, 'tree') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'tree') ? ' active' : ''}`}
                        id="tree"
                        role="tabpanel"
                        aria-labelledby="tree-tab"
                    >
                        <div id="tree-container">
                            {!(c.template || c.templateData) &&
                                EmptyState({
                                    icon: EmptyIconTree(),
                                    title: t('empty-dom-tree-title'),
                                    description: t('empty-dom-tree-desc'),
                                    variant: 'full'
                                })}
                        </div>
                        {GraphLegend({
                            items: [
                                {
                                    colorVar: 'var(--color-cdx-bg-elevated)',
                                    labelKey: 'html-element'
                                },
                                {
                                    colorVar: 'var(--color-cdx-entity-component)',
                                    labelKey: 'component'
                                },
                                {
                                    colorVar: 'var(--color-cdx-entity-directive)',
                                    labelKey: 'html-element-with-directive'
                                }
                            ]
                        })}
                    </div>
                )}

                {hasStandaloneImports && (
                    <div
                        class={`cdx-tab-panel`}
                        id="dependencies"
                        role="tabpanel"
                        aria-labelledby="dependencies-tab"
                    >
                        <ul class="sr-only" aria-label="Component dependency list">
                            {c.imports.map((imp: any) => (
                                <li>
                                    {c.name} imports {typeof imp === 'string' ? imp : imp.name}
                                </li>
                            ))}
                        </ul>
                        <div class="cdx-graph-container">
                            <div class="cdx-graph-viewport">
                                <div id="dependency-graph-container"></div>
                            </div>
                            {GraphZoomControls({ prefix: 'dep-' })}
                        </div>
                        {GraphLegend({ items: DEPENDENCY_LEGEND_ITEMS })}
                    </div>
                )}

                {isTabEnabled(navTabs, 'example') && c.exampleUrls && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'example') ? ' active' : ''}`}
                        id="example"
                        role="tabpanel"
                        aria-labelledby="example-tab"
                    >
                        {c.exampleUrls.map((url: string) => (
                            <iframe class="cdx-example-container" src={url} title="Example preview">
                                <p>{t('no-iframes')}</p>
                            </iframe>
                        ))}
                    </div>
                )}
            </div>

            <script>{`
    window.COMPONENT_TEMPLATE = '<div>${escapeSimpleQuote(c.template || c.templateData)}</div>';
    window.COMPONENTS = [${(data.components ?? []).map((comp: any) => `{'name': '${comp.name}', 'selector': '${comp.selector}'}`).join(',')}];
    window.DIRECTIVES = [${(data.directives ?? []).map((dir: any) => `{'name': '${dir.name}', 'selector': '${dir.selector}'}`).join(',')}];
    window.ACTUAL_COMPONENT = {'name': '${data.name}'};
    ${componentDepGraph ? `window.DEPENDENCY_GRAPH = ${JSON.stringify(componentDepGraph)};` : ''}
`}</script>
        </>
    ) as string;
};
