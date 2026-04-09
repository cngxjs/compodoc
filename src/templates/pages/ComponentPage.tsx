import Html from '@kitajs/html';
import { IconComponent, IconExternalLink, IconFile, IconGitBranch } from '../components/Icons';
import {
    isInfoSection,
    isInitialTab,
    isTabEnabled,
    linkTypeHtml,
    parseDescription,
    relativeUrl,
    extractReadmeHeadings,
    isReadmeEmpty,
    t
} from '../helpers';
import { JsdocExamplesBlock } from '../blocks/JsdocExamplesBlock';
import { GraphZoomControls, GraphLegend, DEPENDENCY_LEGEND_ITEMS } from '../blocks/GraphControls';
import { MetadataRow, MetadataCodeRow, MetadataSection } from '../blocks/MetadataRow';
import { BlockAccessors } from '../blocks/BlockAccessors';
import { BlockConstructor } from '../blocks/BlockConstructor';
import { BlockIndex } from '../blocks/BlockIndex';
import { BlockInput } from '../blocks/BlockInput';
import { BlockMethod } from '../blocks/BlockMethod';
import { BlockOutput } from '../blocks/BlockOutput';
import { BlockProperty } from '../blocks/BlockProperty';
import { highlightCode } from '../../app/engines/syntax-highlight.engine';
import { BlockRelationshipGraph } from '../blocks/BlockRelationshipGraph';
import { EmptyState } from '../components/EmptyState';
import { EmptyIconBook, EmptyIconHtml, EmptyIconPalette, EmptyIconTree } from '../components/EmptyStateIcons';
import { shortPath } from '../helpers/short-url';

const escapeSimpleQuote = (text: string): string => {
    if (!text) return '';
    return text.replaceAll("'", String.raw`\'`).replaceAll(/(\r\n|\n|\r)/gm, '');
};

const formatObject = (obj: unknown): string => {
    let text = JSON.stringify(obj);
    text = text.replace(/{"/, '{<br>&nbsp;&nbsp;&nbsp;&nbsp;"');
    text = text.replace(/,"/, ',<br>&nbsp;&nbsp;&nbsp;&nbsp;"');
    text = text.replace(/}$/, '<br>}');
    return text;
};

const breakComma = (text: string): string => {
    const escaped = String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll(/"/g, '&quot;');
    return escaped.replaceAll(',', ',<br>');
};

const ComponentMetadata = (c: any): string => {
    if (!isInfoSection('metadata')) return '';

    const rows: string[] = [];
    const codeField = (label: string, value: unknown) => {
        if (value != null && value !== '' && (!Array.isArray(value) || value.length > 0)) {
            rows.push(MetadataCodeRow(label, String(value)));
        }
    };

    codeField('selector', c.selector);
    if (c.standalone) codeField('standalone', String(c.standalone));

    if (c.imports?.length > 0) {
        rows.push(MetadataRow('imports', c.imports.map((imp: any) => linkTypeHtml(imp.name)).join(' ')));
    }

    if (c.providers?.length > 0) {
        rows.push(MetadataRow('providers', c.providers.map((p: any) => linkTypeHtml(p.name)).join(' ')));
    }

    if (c.viewProviders?.length > 0) {
        rows.push(MetadataRow('viewProviders', c.viewProviders.map((vp: any) => linkTypeHtml(vp.name)).join(' ')));
    }

    codeField('changeDetection', c.changeDetection);
    codeField('encapsulation', c.encapsulation);
    codeField('animations', c.animations);
    codeField('exportAs', c.exportAs);
    if (c.host) rows.push(MetadataRow('host', `<code>${formatObject(c.host)}</code>`));
    codeField('interpolation', c.interpolation);
    codeField('moduleId', c.moduleId);
    if (c.hasOwnProperty('preserveWhitespaces'))
        codeField('preserveWhitespaces', c.preserveWhitespaces);
    codeField('queries', c.queries);

    if (c.hostDirectives?.length > 0) {
        rows.push(MetadataRow(t('hostdirectives'), c.hostDirectives.map((hd: any) => {
            let html = linkTypeHtml(hd.name);
            if (hd.inputs?.length > 0) html += ` <span class="cdx-metadata-label">${t('inputs')}:</span> ${hd.inputs.join(', ')}`;
            if (hd.outputs?.length > 0) html += ` <span class="cdx-metadata-label">${t('outputs')}:</span> ${hd.outputs.join(', ')}`;
            return html;
        }).join(' ')));
    }

    if (c.entryComponents?.length > 0) {
        rows.push(MetadataRow('entryComponents', c.entryComponents.map((ec: any) => linkTypeHtml(ec.name)).join(' ')));
    }

    codeField('templateUrl', c.templateUrl);
    if (c.styleUrls?.length > 0) codeField('styleUrls', breakComma(c.styleUrls));

    if (c.extends?.length > 0) {
        rows.push(MetadataRow('extends', (c.extends as string[]).map(ext => linkTypeHtml(ext)).join(' ')));
    }
    if (c.implements?.length > 0) {
        rows.push(MetadataRow('implements', (c.implements as string[]).map(impl => linkTypeHtml(impl)).join(' ')));
    }

    codeField('tag', c.tag);
    codeField('styleUrl', c.styleUrl);
    codeField('shadow', c.shadow);
    codeField('scoped', c.scoped);
    codeField('assetsDir', c.assetsDir);
    codeField('assetsDirs', c.assetsDirs);

    return MetadataSection({ rows });
};

const InfoContent = (data: any): string => {
    const c = data.component;
    const depth = data.depth;

    return (
        <>
            {isInfoSection('deprecated') && c.deprecated && (
                <div class="cdx-deprecation-banner" role="alert">
                    <strong>{t('deprecated')}</strong>
                    <span>{c.deprecationMessage}</span>
                </div>
            )}

            {isInfoSection('description') && c.description && (
                <section class="cdx-content-section">
                    <h3 class="cdx-section-heading">{t('description')}</h3>
                    <div class="cdx-prose">{parseDescription(c.description, depth)}</div>
                </section>
            )}

            {isInfoSection('examples') && c.jsdoctags &&
                JsdocExamplesBlock({ tags: c.jsdoctags, variant: 'code', level: 'section' })}

            {(c.storybookUrl || c.figmaUrl || c.route) && (
                <div class="cdx-external-links">
                    {c.storybookUrl && (
                        <a
                            href={c.storybookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="cdx-ext-link"
                        >
                            {IconExternalLink()} Storybook
                        </a>
                    )}
                    {c.figmaUrl && (
                        <a
                            href={c.figmaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="cdx-ext-link"
                        >
                            {IconExternalLink()} Figma
                        </a>
                    )}
                    {c.route && (
                        <span class="cdx-route-info">
                            {IconGitBranch()} {c.route}
                        </span>
                    )}
                </div>
            )}

            {ComponentMetadata(c)}

            {c.slots?.length > 0 && (
                <section class="cdx-content-section">
                    <h3 class="cdx-section-heading">Content Slots</h3>
                    <dl class="cdx-metadata-card">
                        {c.slots.map((slot: any) => (<>
                            <dt><code>{slot.name}</code></dt>
                            <dd>{slot.description}</dd>
                        </>))}
                    </dl>
                </section>
            )}

            {data.relationships &&
                BlockRelationshipGraph({
                    incoming: data.relationships.incoming,
                    outgoing: data.relationships.outgoing,
                    entityName: c.name
                })}

            {isInfoSection('index') &&
                BlockIndex({
                    properties: c.propertiesClass,
                    methods: c.methodsClass,
                    inputs: c.inputsClass,
                    outputs: c.outputsClass,
                    hostBindings: c.hostBindings,
                    hostListeners: c.hostListeners,
                    accessors: c.accessors
                })}

            {isInfoSection('constructor') &&
                c.constructorObj &&
                BlockConstructor({
                    constructor: c.constructorObj,
                    file: c.file,
                    depth,
                    navTabs: data.navTabs
                })}
            {isInfoSection('inputs') &&
                c.inputsClass?.length > 0 &&
                BlockInput({ element: c, file: c.file, depth, navTabs: data.navTabs })}
            {isInfoSection('outputs') &&
                c.outputsClass?.length > 0 &&
                BlockOutput({ element: c, file: c.file, depth, navTabs: data.navTabs })}
            {isInfoSection('hostBindings') &&
                c.hostBindings?.length > 0 &&
                BlockProperty({
                    properties: c.hostBindings,
                    file: c.file,
                    title: 'HostBindings',
                    depth,
                    navTabs: data.navTabs
                })}
            {isInfoSection('hostListeners') &&
                c.hostListeners?.length > 0 &&
                BlockMethod({
                    methods: c.hostListeners,
                    file: c.file,
                    title: 'HostListeners',
                    depth,
                    navTabs: data.navTabs
                })}
            {isInfoSection('methods') &&
                c.methodsClass?.length > 0 &&
                BlockMethod({
                    methods: c.methodsClass,
                    file: c.file,
                    depth,
                    navTabs: data.navTabs
                })}
            {isInfoSection('properties') &&
                c.propertiesClass?.length > 0 &&
                BlockProperty({
                    properties: c.propertiesClass,
                    file: c.file,
                    depth,
                    navTabs: data.navTabs
                })}
            {isInfoSection('accessors') &&
                c.accessors && Object.keys(c.accessors).length > 0 &&
                BlockAccessors({
                    accessors: c.accessors,
                    file: c.file,
                    depth,
                    navTabs: data.navTabs
                })}
        </>
    ) as string;
};

export const ComponentPage = (data: any): string => {
    const c = data.component;
    const depth = data.depth;
    const base = relativeUrl(depth);
    const navTabs = data.navTabs;
    const hasStandaloneImports = c.standalone && c.imports?.length > 0;

    const componentDepGraph = hasStandaloneImports ? (() => {
        const allComponents = data.components as any[] ?? [];
        const allDirectives = data.directives as any[] ?? [];
        const allPipes = data.pipes as any[] ?? [];
        const allModules = data.modules as any[] ?? [];
        const allInjectables = data.injectables as any[] ?? [];
        const entityMap = new Map<string, { type: string; url?: string }>();
        for (const x of allComponents) entityMap.set(x.name, { type: 'component', url: `${base}components/${x.name}.html` });
        for (const x of allDirectives) entityMap.set(x.name, { type: 'directive', url: `${base}directives/${x.name}.html` });
        for (const x of allPipes) entityMap.set(x.name, { type: 'pipe', url: `${base}pipes/${x.name}.html` });
        for (const x of allModules) entityMap.set(x.name, { type: 'module', url: `${base}modules/${x.name}.html` });
        for (const x of allInjectables) entityMap.set(x.name, { type: 'injectable', url: `${base}injectables/${x.name}.html` });
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
    })() : null;

    return (
        <>
            <div class="cdx-entity-hero" style="--cdx-hero-color: var(--color-cdx-entity-component)">
                <div class="cdx-entity-hero-watermark" aria-hidden="true">{IconComponent()}</div>
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
                    {c.standalone ? <span class="cdx-badge cdx-badge--standalone">Standalone</span> : ''}
                    {c.zoneless ? <span class="cdx-badge cdx-badge--zoneless">Zoneless</span> : ''}
                    {c.beta ? <span class="cdx-badge cdx-badge--beta">Beta</span> : ''}
                    {c.since ? <span class="cdx-badge cdx-badge--since">v{c.since}</span> : ''}
                    {c.breaking ? <span class="cdx-badge cdx-badge--breaking">Breaking {c.breaking}</span> : ''}
                </div>
                {c.selector ? <p class="cdx-entity-hero-context">{c.selector}</p> : ''}
                {!data.disableFilePath && c.file && (
                    <p class="cdx-entity-hero-file" aria-label="Source file">
                        {IconFile()}
                        <span>{c.file}</span>
                    </p>
                )}
            </div>

            <ul class="cdx-tab-bar" role="tablist">
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

                {isTabEnabled(navTabs, 'readme') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'readme') ? ' active' : ''}`}
                        id="readme"
                        role="tabpanel"
                        aria-labelledby="readme-tab"
                    >
                        {isReadmeEmpty(c.readme)
                            ? <>{extractReadmeHeadings(c.readme)}{EmptyState({ icon: EmptyIconBook(), title: t('empty-readme-title'), description: t('empty-readme-desc'), variant: 'full' })}</>
                            : <p>{c.readme}</p>
                        }
                    </div>
                )}

                {isTabEnabled(navTabs, 'source') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'source') ? ' active' : ''} tab-source-code`}
                        id="source"
                        role="tabpanel"
                        aria-labelledby="source-tab"
                    >
                        <div class="cdx-source-code">
                            {c.file && <div class="cdx-source-header"><span>{shortPath(c.file)}</span></div>}
                            {highlightCode(c.sourceCode ?? '', { lang: 'typescript', mode: 'source' })}
                        </div>
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
                            ? <div class="cdx-source-code">
                                {c.templateUrl?.[0] && <div class="cdx-source-header"><span>{shortPath(c.templateUrl[0])}</span></div>}
                                {highlightCode(c.templateData, { lang: 'html', mode: 'source' })}
                              </div>
                            : EmptyState({ icon: EmptyIconHtml(), title: t('empty-template-title'), description: t('empty-template-desc'), variant: 'full' })
                        }
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
                            ? c.styleUrlsData.map((s: any) => (
                                <div class="cdx-source-code">
                                    {s.styleUrl && <div class="cdx-source-header"><span>{shortPath(s.styleUrl)}</span></div>}
                                    {highlightCode(s.data, { lang: 'scss', mode: 'source' })}
                                </div>
                            ))
                            : ''}
                        {c.stylesData && c.stylesData !== '' && (
                            <div class="cdx-source-code">
                                <div class="cdx-source-header"><span>Inline Styles</span></div>
                                {highlightCode(c.stylesData, { lang: 'scss', mode: 'source' })}
                            </div>
                        )}
                        {!(c.styleUrlsData?.length > 0) && !(c.stylesData && c.stylesData !== '') &&
                            EmptyState({ icon: EmptyIconPalette(), title: t('empty-styles-title'), description: t('empty-styles-desc'), variant: 'full' })
                        }
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
                                EmptyState({ icon: EmptyIconTree(), title: t('empty-dom-tree-title'), description: t('empty-dom-tree-desc'), variant: 'full' })
                            }
                        </div>
                        {GraphLegend({ items: [
                            { colorVar: 'var(--color-cdx-bg-elevated)', labelKey: 'html-element' },
                            { colorVar: 'var(--color-cdx-entity-component)', labelKey: 'component' },
                            { colorVar: 'var(--color-cdx-entity-directive)', labelKey: 'html-element-with-directive' },
                        ] })}
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
                                <li>{c.name} imports {typeof imp === 'string' ? imp : imp.name}</li>
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
                            <iframe class="cdx-example-container" src={url}>
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
