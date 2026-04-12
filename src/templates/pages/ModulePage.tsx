import Html from '@kitajs/html';
import { BlockMethod } from '../blocks/BlockMethod';
import { EntityTabs } from '../blocks/EntityTabs';
import { GraphZoomControls } from '../blocks/GraphControls';
import { IconFile, IconInterface, IconMaximize, IconModule } from '../components/Icons';
import { parseDescription, relativeUrl, t } from '../helpers';

const NG2_MODULES = ['BrowserModule', 'FormsModule', 'HttpModule', 'RouterModule'];
const isAngularModule = (name: string): boolean => NG2_MODULES.some(m => name.includes(m));

const ModuleList = (props: {
    items: any[];
    titleKey: string;
    docsPath: string;
    depth: number;
    buildHref: (item: any, base: string) => string | null;
}): string => {
    if (!props.items?.length) {
        return '';
    }
    const base = relativeUrl(props.depth);
    return (
        <div class="cdx-module-list-section">
            <h3>
                {t(props.titleKey)}
                <a
                    href={`https://angular.dev/api/core/NgModule`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Official documentation about module ${props.docsPath}`}
                >
                    {IconInterface()}
                </a>
            </h3>
            <ul class="cdx-entity-list">
                {props.items.map(item => {
                    const href = props.buildHref(item, base);
                    return (
                        <li class="cdx-entity-list-item">
                            {href ? <a href={href}>{item.name ?? item}</a> : (item.name ?? item)}
                        </li>
                    );
                })}
            </ul>
        </div>
    ) as string;
};

export const ModulePage = (data: any): string => {
    const mod = data.module;
    const depth = data.depth;
    const _base = relativeUrl(depth);

    const hasModuleLists =
        (mod.declarations?.length ?? 0) > 0 ||
        (mod.entryComponents?.length ?? 0) > 0 ||
        (mod.providers?.length ?? 0) > 0 ||
        (mod.imports?.length ?? 0) > 0 ||
        (mod.exports?.length ?? 0) > 0 ||
        (mod.bootstrap?.length ?? 0) > 0 ||
        (mod.schemas?.length ?? 0) > 0;

    const infoContent = (
        <>
            {mod.ngid && (
                <section class="cdx-content-section">
                    <h3 class="cdx-section-heading">{t('identifier')}</h3>
                    <p>{mod.ngid}</p>
                </section>
            )}

            {mod.deprecated && (
                <div class="cdx-deprecation-banner" role="alert">
                    <strong>{t('deprecated')}</strong>
                    <span>{mod.deprecationMessage}</span>
                </div>
            )}

            {mod.description && (
                <section class="cdx-content-section">
                    <h3 class="cdx-section-heading">{t('description')}</h3>
                    <div class="cdx-prose">{parseDescription(mod.description, depth)}</div>
                </section>
            )}

            {hasModuleLists && (
                <section class="cdx-content-section">
                    <h3 class="cdx-section-heading">{t('metadata')}</h3>
                    <div class="cdx-module-lists">
                        {ModuleList({
                            items: mod.declarations,
                            titleKey: 'declarations',
                            docsPath: 'declarations',
                            depth,
                            buildHref: (item, b) => `${b}${item.type}s/${item.name}.html`
                        })}
                        {ModuleList({
                            items: mod.entryComponents,
                            titleKey: 'entrycomponents',
                            docsPath: 'entryComponents',
                            depth,
                            buildHref: (item, b) => `${b}${item.type}s/${item.name}.html`
                        })}
                        {ModuleList({
                            items: mod.providers,
                            titleKey: 'providers',
                            docsPath: 'providers',
                            depth,
                            buildHref: (item, b) => {
                                if (item.type === 'injectable') {
                                    return `${b}injectables/${item.name}.html`;
                                }
                                if (item.type === 'interceptor') {
                                    return `${b}interceptors/${item.name}.html`;
                                }
                                return null;
                            }
                        })}
                        {ModuleList({
                            items: mod.imports,
                            titleKey: 'imports',
                            docsPath: 'imports',
                            depth,
                            buildHref: (item, b) =>
                                isAngularModule(item.name) ? null : `${b}modules/${item.name}.html`
                        })}
                        {ModuleList({
                            items: mod.exports,
                            titleKey: 'exports',
                            docsPath: 'exports',
                            depth,
                            buildHref: (item, b) =>
                                isAngularModule(item.name)
                                    ? null
                                    : `${b}${item.type}s/${item.name}.html`
                        })}
                        {ModuleList({
                            items: mod.bootstrap,
                            titleKey: 'bootstrap',
                            docsPath: 'bootstrap',
                            depth,
                            buildHref: (item, b) => `${b}${item.type}s/${item.name}.html`
                        })}
                        {mod.schemas?.length > 0 && (
                            <div class="cdx-module-list-section">
                                <h3>
                                    {t('schemas')}
                                    <a
                                        href="https://angular.dev/api/core/NgModule"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Official documentation about module schemas"
                                    >
                                        {IconInterface()}
                                    </a>
                                </h3>
                                <ul class="cdx-entity-list">
                                    {mod.schemas.map((s: string) => (
                                        <li class="cdx-entity-list-item">
                                            <a
                                                href={`https://angular.dev/api/core/${s}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {s}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {mod.methods?.length > 0 &&
                BlockMethod({ methods: mod.methods, file: mod.file, depth })}
        </>
    ) as string;

    return (
        <>
            <div class="cdx-entity-hero" style="--cdx-hero-color: var(--color-cdx-entity-module)">
                <div class="cdx-entity-hero-watermark" aria-hidden="true">
                    {IconModule()}
                </div>
                <nav aria-label="Breadcrumb">
                    <ol class="cdx-breadcrumb">
                        <li>{t('modules')}</li>
                        <li aria-current="page">{data.name}</li>
                    </ol>
                </nav>
                <h1 class="cdx-entity-hero-name">
                    <span class={mod.deprecated ? 'cdx-member-name--deprecated' : ''}>
                        {data.name}
                    </span>
                </h1>
                <div class="cdx-entity-hero-badges">
                    <span class="cdx-badge cdx-badge--entity-module">Module</span>
                </div>
                {!data.disableFilePath && mod.file && (
                    <p class="cdx-entity-hero-file" title="Source file" aria-label="Source file">
                        {IconFile()}
                        <span>{mod.file}</span>
                    </p>
                )}
            </div>

            {!data.disableGraph && mod.graph && (
                <div class="cdx-graph-container">
                    <div class="cdx-graph-viewport">
                        <div id="module-graph-svg">{mod.graph}</div>
                        <button
                            type="button"
                            id="fullscreen"
                            class="cdx-graph-fullscreen-btn"
                            aria-label="Fullscreen"
                        >
                            {IconMaximize()}
                        </button>
                    </div>
                    {GraphZoomControls({})}
                </div>
            )}

            {EntityTabs({
                navTabs: data.navTabs,
                infoContent,
                readme: mod.readme,
                sourceCode: mod.sourceCode
            })}
        </>
    ) as string;
};
