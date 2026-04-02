import Html from '@kitajs/html';
import { isInitialTab, isTabEnabled, parseDescription, relativeUrl, t } from '../helpers';
import { BlockMethod } from '../blocks/BlockMethod';
import { EntityTabs } from '../blocks/EntityTabs';

const NG2_MODULES = ['BrowserModule', 'FormsModule', 'HttpModule', 'RouterModule'];
const isAngularModule = (name: string): boolean => NG2_MODULES.some(m => name.includes(m));

type ModuleListItem = { readonly name: string; readonly type: string };

const ModuleList = (props: {
    items: any[];
    titleKey: string;
    docsPath: string;
    depth: number;
    buildHref: (item: any, base: string) => string | null;
}): string => {
    if (!props.items?.length) return '';
    const base = relativeUrl(props.depth);
    return (
        <div class="col-sm-3">
            <h3>{t(props.titleKey)}<a href={`https://angular.io/api/core/NgModule#${props.docsPath}`} target="_blank" rel="noopener noreferrer" title={`Official documentation about module ${props.docsPath}`}><span class="icon ion-ios-information-circle-outline"></span></a></h3>
            <ul class="list-group">
                {props.items.map(item => {
                    const href = props.buildHref(item, base);
                    return (
                        <li class="list-group-item">
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
    const base = relativeUrl(depth);

    const infoContent = (<>
        {!data.disableFilePath && (<>
            <p class="comment"><h3>{t('file')}</h3></p>
            <p class="comment"><code>{mod.file}</code></p>
        </>)}

        {mod.ngid && (<>
            <p class="comment"><h3>{t('identifier')}</h3></p>
            <p class="comment">{mod.ngid}</p>
        </>)}

        {mod.deprecated && (<>
            <p class="comment"><h3 class="deprecated">{t('deprecated')}</h3></p>
            <p class="comment">{mod.deprecationMessage}</p>
        </>)}

        {mod.description && (<>
            <p class="comment"><h3>{t('description')}</h3></p>
            <p class="comment">{parseDescription(mod.description, depth)}</p>
        </>)}

        <div class="container-fluid module">
            <div class="row">
                {ModuleList({
                    items: mod.declarations, titleKey: 'declarations', docsPath: 'declarations', depth,
                    buildHref: (item, b) => `${b}${item.type}s/${item.name}.html`,
                })}
                {ModuleList({
                    items: mod.entryComponents, titleKey: 'entrycomponents', docsPath: 'entryComponents', depth,
                    buildHref: (item, b) => `${b}${item.type}s/${item.name}.html`,
                })}
                {ModuleList({
                    items: mod.providers, titleKey: 'providers', docsPath: 'providers', depth,
                    buildHref: (item, b) => {
                        if (item.type === 'injectable') return `${b}injectables/${item.name}.html`;
                        if (item.type === 'interceptor') return `${b}interceptors/${item.name}.html`;
                        return null;
                    },
                })}
                {ModuleList({
                    items: mod.imports, titleKey: 'imports', docsPath: 'imports', depth,
                    buildHref: (item, b) => isAngularModule(item.name) ? null : `${b}modules/${item.name}.html`,
                })}
                {ModuleList({
                    items: mod.exports, titleKey: 'exports', docsPath: 'exports', depth,
                    buildHref: (item, b) => isAngularModule(item.name) ? null : `${b}${item.type}s/${item.name}.html`,
                })}
                {ModuleList({
                    items: mod.bootstrap, titleKey: 'bootstrap', docsPath: 'bootstrap', depth,
                    buildHref: (item, b) => `${b}${item.type}s/${item.name}.html`,
                })}
                {mod.schemas?.length > 0 && (
                    <div class="col-sm-3">
                        <h3>{t('schemas')}<a href="https://angular.io/api/core/NgModule#schemas" target="_blank" rel="noopener noreferrer" title="Official documentation about module schemas"><span class="icon ion-ios-information-circle-outline"></span></a></h3>
                        <ul class="list-group">
                            {mod.schemas.map((s: string) => (
                                <li class="list-group-item">
                                    <a href={`https://angular.io/api/core/${s}`} target="_blank" rel="noopener noreferrer">{s}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>

        {mod.methods && BlockMethod({ methods: mod.methods, file: mod.file, depth })}
    </>) as string;

    return (<>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('modules')}</li>
            <li class={mod.deprecated ? 'breadcrumb-item deprecated-name' : 'breadcrumb-item'}>{data.name}</li>
        </ol>

        {!data.disableGraph && mod.graph && (<>
            <div class="text-center module-graph-container">
                <div id="module-graph-svg">{mod.graph}</div>
                <i id="fullscreen" class="icon ion-ios-resize module-graph-fullscreen-btn" aria-hidden="true"></i>
                <div class="btn-group size-buttons">
                    <button id="zoom-in" class="btn btn-default btn-sm">{t('zoomin')}</button>
                    <button id="reset" class="btn btn-default btn-sm">{t('reset')}</button>
                    <button id="zoom-out" class="btn btn-default btn-sm">{t('zoomout')}</button>
                </div>
            </div>
        </>)}

        {EntityTabs({
            navTabs: data.navTabs,
            infoContent,
            readme: mod.readme,
            sourceCode: mod.sourceCode,
        })}
    </>) as string;
};
