import Html from '@kitajs/html';
import { IconExternalLink, IconGitBranch } from '../components/Icons';
import {
    extractJsdocCodeExamples,
    isInfoSection,
    isInitialTab,
    isTabEnabled,
    linkTypeHtml,
    parseDescription,
    relativeUrl,
    t
} from '../helpers';
import { BlockAccessors } from '../blocks/BlockAccessors';
import { BlockConstructor } from '../blocks/BlockConstructor';
import { BlockIndex } from '../blocks/BlockIndex';
import { BlockInput } from '../blocks/BlockInput';
import { BlockMethod } from '../blocks/BlockMethod';
import { BlockOutput } from '../blocks/BlockOutput';
import { BlockProperty } from '../blocks/BlockProperty';
import { highlightCode } from '../../app/engines/syntax-highlight.engine';
import { BlockRelationshipGraph } from '../blocks/BlockRelationshipGraph';

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

type MetadataRow = { label: string; value: string; isCode?: boolean };

const MetadataField = (props: MetadataRow): string =>
    (
        <tr>
            <td class="col-md-3">{props.label}</td>
            <td class="col-md-9">
                {props.isCode !== false ? <code>{props.value}</code> : props.value}
            </td>
        </tr>
    ) as string;

const ComponentMetadata = (c: any): string => {
    if (!isInfoSection('metadata')) return '';

    const rows: string[] = [];
    const field = (label: string, value: unknown, isCode = true) => {
        if (value != null && value !== '' && (!Array.isArray(value) || value.length > 0)) {
            rows.push(MetadataField({ label, value: String(value), isCode }));
        }
    };

    field('animations', c.animations);
    field('changeDetection', c.changeDetection);
    field('encapsulation', c.encapsulation);

    if (c.hostDirectives?.length > 0) {
        rows.push(
            (
                <tr>
                    <td class="col-md-3">{t('hostdirectives')}</td>
                    <td class="col-md-9">
                        {c.hostDirectives.map((hd: any) => (
                            <>
                                {linkTypeHtml(hd.name)}
                                <br />
                                {hd.inputs?.length > 0 && (
                                    <div>
                                        <i>&nbsp;{t('inputs')}</i> : {hd.inputs.join(' ')}
                                    </div>
                                )}
                                {hd.outputs?.length > 0 && (
                                    <div>
                                        <i>&nbsp;{t('outputs')}</i> : {hd.outputs.join(' ')}
                                    </div>
                                )}
                            </>
                        ))}
                    </td>
                </tr>
            ) as string
        );
    }

    if (c.entryComponents?.length > 0) {
        // already guarded
        rows.push(
            (
                <tr>
                    <td class="col-md-3">entryComponents</td>
                    <td class="col-md-9">
                        {c.entryComponents.map((ec: any) => linkTypeHtml(ec.name)).join(' ')}
                    </td>
                </tr>
            ) as string
        );
    }

    field('exportAs', c.exportAs);
    if (c.host) rows.push(MetadataField({ label: 'host', value: formatObject(c.host) }));
    field('interpolation', c.interpolation);
    field('moduleId', c.moduleId);
    if (c.hasOwnProperty('preserveWhitespaces'))
        field('preserveWhitespaces', c.preserveWhitespaces);

    if (c.providers?.length > 0) {
        rows.push(
            (
                <tr>
                    <td class="col-md-3">providers</td>
                    <td class="col-md-9">
                        {c.providers.map((p: any) => linkTypeHtml(p.name)).join(' ')}
                    </td>
                </tr>
            ) as string
        );
    }

    field('queries', c.queries);
    field('selector', c.selector);
    if (c.standalone) field('standalone', String(c.standalone));

    if (c.imports?.length > 0) {
        rows.push(
            (
                <tr>
                    <td class="col-md-3">imports</td>
                    <td class="col-md-9">
                        {c.imports.map((imp: any) => linkTypeHtml(imp.name)).join(' ')}
                    </td>
                </tr>
            ) as string
        );
    }

    if (c.styleUrls?.length > 0)
        rows.push(MetadataField({ label: 'styleUrls', value: breakComma(c.styleUrls) }));
    if (c.styles?.length > 0) field('styles', c.styles);
    if (c.template?.trim()) {
        rows.push(
            (
                <tr>
                    <td class="col-md-3">template</td>
                    <td class="col-md-9">
                        <pre class="line-numbers">
                            <code class="language-html">{c.template}</code>
                        </pre>
                    </td>
                </tr>
            ) as string
        );
    }
    field('templateUrl', c.templateUrl);

    if (c.viewProviders?.length > 0) {
        rows.push(
            (
                <tr>
                    <td class="col-md-3">viewProviders</td>
                    <td class="col-md-9">
                        <code>
                            {c.viewProviders.map((vp: any) => linkTypeHtml(vp.name)).join(' ')}
                        </code>
                    </td>
                </tr>
            ) as string
        );
    }

    field('tag', c.tag);
    field('styleUrl', c.styleUrl);
    field('shadow', c.shadow);
    field('scoped', c.scoped);
    field('assetsDir', c.assetsDir);
    field('assetsDirs', c.assetsDirs);

    if (rows.length === 0) return '';

    return (
        <section data-compodoc="block-metadata">
            <h3>{t('metadata')}</h3>
            <table class="table table-sm table-hover metadata">
                <tbody>{rows.join('')}</tbody>
            </table>
        </section>
    ) as string;
};

const InfoContent = (data: any): string => {
    const c = data.component;
    const depth = data.depth;

    return (
        <>
            {isInfoSection('file') && !data.disableFilePath && (
                <>
                    <p class="comment">
                        <h3>{t('file')}</h3>
                    </p>
                    <p class="comment">
                        <code>{c.file}</code>
                    </p>
                </>
            )}

            {isInfoSection('deprecated') && c.deprecated && (
                <>
                    <p class="comment">
                        <h3 class="deprecated">{t('deprecated')}</h3>
                    </p>
                    <p class="comment">{c.deprecationMessage}</p>
                </>
            )}

            {isInfoSection('description') && c.description && (
                <>
                    <p class="comment">
                        <h3>{t('description')}</h3>
                    </p>
                    <p class="comment">{parseDescription(c.description, depth)}</p>
                </>
            )}

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

            {c.slots?.length > 0 && (
                <>
                    <h3>Content Slots</h3>
                    <table class="table table-sm table-hover">
                        <thead>
                            <tr>
                                <th>Slot</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {c.slots.map((slot: any) => (
                                <tr>
                                    <td>
                                        <code>{slot.name}</code>
                                    </td>
                                    <td>{slot.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {isInfoSection('extends') && c.extends && (
                <>
                    <p class="comment">
                        <h3>{t('extends')}</h3>
                    </p>
                    <p class="comment">
                        {(c.extends as string[]).map(ext => linkTypeHtml(ext)).join(' ')}
                    </p>
                </>
            )}

            {isInfoSection('extends') && c.implements && (
                <>
                    <p class="comment">
                        <h3>{t('implements')}</h3>
                    </p>
                    <p class="comment">
                        {(c.implements as string[]).map(impl => linkTypeHtml(impl)).join(' ')}
                    </p>
                </>
            )}

            {isInfoSection('examples') &&
                c.jsdoctags &&
                (() => {
                    const examples = extractJsdocCodeExamples(c.jsdoctags);
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

            {ComponentMetadata(c)}

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
                c.inputsClass &&
                BlockInput({ element: c, file: c.file, depth, navTabs: data.navTabs })}
            {isInfoSection('outputs') &&
                c.outputsClass &&
                BlockOutput({ element: c, file: c.file, depth, navTabs: data.navTabs })}
            {isInfoSection('hostBindings') &&
                c.hostBindings &&
                BlockProperty({
                    properties: c.hostBindings,
                    file: c.file,
                    title: 'HostBindings',
                    depth,
                    navTabs: data.navTabs
                })}
            {isInfoSection('hostListeners') &&
                c.hostListeners &&
                BlockMethod({
                    methods: c.hostListeners,
                    file: c.file,
                    title: 'HostListeners',
                    depth,
                    navTabs: data.navTabs
                })}
            {isInfoSection('methods') &&
                c.methodsClass &&
                BlockMethod({
                    methods: c.methodsClass,
                    file: c.file,
                    depth,
                    navTabs: data.navTabs
                })}
            {isInfoSection('properties') &&
                c.propertiesClass &&
                BlockProperty({
                    properties: c.propertiesClass,
                    file: c.file,
                    depth,
                    navTabs: data.navTabs
                })}
            {isInfoSection('accessors') &&
                c.accessors &&
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

    return (
        <>
            <ol class="cdx-breadcrumb">
                <li class="">{t('components')}</li>
                <li class={c.deprecated ? 'deprecated-name' : ''}>
                    {c.name}
                    {c.standalone ? (
                        <span class="cdx-badge cdx-badge--standalone">Standalone</span>
                    ) : (
                        ''
                    )}
                    {c.zoneless ? <span class="cdx-badge cdx-badge--zoneless">Zoneless</span> : ''}
                    {c.beta ? <span class="cdx-badge cdx-badge--beta">Beta</span> : ''}
                    {c.since ? <span class="cdx-badge cdx-badge--since">v{c.since}</span> : ''}
                    {c.breaking ? (
                        <span class="cdx-badge cdx-badge--breaking">Breaking {c.breaking}</span>
                    ) : (
                        ''
                    )}
                </li>
            </ol>

            <ul class="cdx-tabs" role="tablist">
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
                        <p>{c.readme}</p>
                    </div>
                )}

                {isTabEnabled(navTabs, 'source') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'source') ? ' active' : ''} tab-source-code`}
                        id="source"
                        role="tabpanel"
                        aria-labelledby="source-tab"
                    >
                        <div class="compodoc-sourcecode">
                            {highlightCode(c.sourceCode ?? '', 'typescript')}
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
                        <pre class="line-numbers">
                            <code class="language-html">{c.templateData}</code>
                        </pre>
                    </div>
                )}

                {isTabEnabled(navTabs, 'styleData') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'styleData') ? ' active' : ''}`}
                        id="styleData"
                        role="tabpanel"
                        aria-labelledby="styleData-tab"
                    >
                        {c.styleUrlsData?.length > 0 &&
                            c.styleUrlsData.map((s: any) => (
                                <>
                                    <p class="comment">
                                        <code>{s.styleUrl}</code>
                                    </p>
                                    <pre class="line-numbers">
                                        <code class="language-scss">{s.data}</code>
                                    </pre>
                                </>
                            ))}
                        {c.stylesData && c.stylesData !== '' && (
                            <pre class="line-numbers">
                                <code class="language-scss">{c.stylesData}</code>
                            </pre>
                        )}
                    </div>
                )}

                {isTabEnabled(navTabs, 'tree') && (
                    <div
                        class={`cdx-tab-panel${isInitialTab(navTabs, 'tree') ? ' active' : ''}`}
                        id="tree"
                        role="tabpanel"
                        aria-labelledby="tree-tab"
                    >
                        <div id="tree-container"></div>
                        <div class="tree-legend">
                            <div class="title">
                                <b>{t('legend')}</b>
                            </div>
                            <div>
                                <div class="color htmlelement"></div>
                                <span>{t('html-element')}</span>
                            </div>
                            <div>
                                <div class="color component"></div>
                                <span>{t('component')}</span>
                            </div>
                            <div>
                                <div class="color directive"></div>
                                <span>{t('html-element-with-directive')}</span>
                            </div>
                        </div>
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
                            <iframe class="exampleContainer" src={url}>
                                <p>{t('no-iframes')}</p>
                            </iframe>
                        ))}
                    </div>
                )}
            </div>

            <script>{`
    const COMPONENT_TEMPLATE = '<div>${escapeSimpleQuote(c.template || c.templateData)}</div>'
    const COMPONENTS = [${(data.components ?? []).map((comp: any) => `{'name': '${comp.name}', 'selector': '${comp.selector}'}`).join(',')}];
    const DIRECTIVES = [${(data.directives ?? []).map((dir: any) => `{'name': '${dir.name}', 'selector': '${dir.selector}'}`).join(',')}];
    const ACTUAL_COMPONENT = {'name': '${data.name}'};
`}</script>
        </>
    ) as string;
};
