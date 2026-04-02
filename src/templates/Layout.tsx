import Html from '@kitajs/html';
import { relativeUrl } from './helpers';

export type PageData = {
    readonly documentationMainName: string;
    readonly depth: number;
    readonly context: string;
    readonly name: string;
    readonly filename?: string;
    readonly theme?: string;
    readonly disableSearch?: boolean;
    readonly disableDependencies?: boolean;
    readonly disableProperties?: boolean;
    readonly hideDarkModeToggle?: boolean;
    readonly maxSearchResults?: number;
    readonly gaID?: string;
    readonly gaSite?: string;
};

type LayoutProps = {
    readonly data: PageData;
    readonly content: string;
    readonly menuHtml: string;
    readonly menuHtmlMobile: string;
    readonly searchInputHtml: string;
    readonly searchResultsHtml: string;
};

const IframeTrackingScript = `
function sendCurrentUrlToParent() {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage({
            type: 'compodoc-iframe-navigate',
            url: window.location.pathname + window.location.hash
        }, '*');
    }
}
window.addEventListener('hashchange', sendCurrentUrlToParent, false);
window.addEventListener('popstate', sendCurrentUrlToParent, false);
window.addEventListener('DOMContentLoaded', sendCurrentUrlToParent, false);
`;

const PageGlobals = (props: { data: PageData }) => {
    const { data } = props;
    const pageUrl = data.filename ? `${data.filename}.html` : `${data.name}.html`;
    return (
        <script>
            {(`
                var COMPODOC_CURRENT_PAGE_DEPTH = ${data.depth};
                var COMPODOC_CURRENT_PAGE_CONTEXT = '${data.context}';
                var COMPODOC_CURRENT_PAGE_URL = '${pageUrl}';
                ${!data.disableSearch ? `var MAX_SEARCH_RESULTS = ${data.maxSearchResults ?? 15};` : ''}
            `)}
        </script>
    );
};

const GoogleAnalytics = (props: { gaID: string; gaSite: string }) => (
    <script>
        {(`
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
            ga('create', '${props.gaID}', '${props.gaSite}');
            ga('send', 'pageview');
        `)}
    </script>
);

const DarkModeToggle = () => (
    <label class="dark-mode-switch">
        <input type="checkbox" />
        <span class="slider">
            <svg class="slider-icon" viewBox="0 0 24 24" fill="none" height="20" stroke="#000"
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2" width="20"
                xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
            </svg>
        </span>
    </label>
);

export const Layout = (props: LayoutProps): string => {
    const { data, content, menuHtml, menuHtmlMobile, searchInputHtml, searchResultsHtml } = props;
    const r = (path: string) => relativeUrl(data.depth, path);

    return '<!doctype html>\n' + (
        <html class="no-js" lang="">
            <head>
                <meta charset="utf-8" />
                <meta http-equiv="x-ua-compatible" content="ie=edge" />
                <title>{data.documentationMainName}</title>
                <meta name="description" content="" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" type="image/x-icon" href={r('images/favicon.ico')} />
                <style>{(`
                    .menu .collapse.in { display: block !important; }
                    .menu .collapse:not(.in) { display: none !important; }
                `)}</style>
                <link rel="stylesheet" href={r('styles/style.css')} />
                <link rel="stylesheet" href={r('styles/dark.css')} />
                {data.theme && data.theme !== 'gitbook' && (
                    <link rel="stylesheet" href={r(`styles/${data.theme}.css`)} />
                )}
            </head>
            <body>
                <script src={r('js/compodocx.js')}></script>
                <script>{(IframeTrackingScript)}</script>

                <div class="navbar navbar-default navbar-fixed-top d-md-none p-0">
                    <div class="d-flex">
                        <a href={r('')} class="navbar-brand">{data.documentationMainName}</a>
                        <button type="button" class="btn btn-default btn-menu ion-ios-menu" id="btn-menu"></button>
                    </div>
                </div>

                <div class="xs-menu menu" id="mobile-menu">
                    {!data.disableSearch && (searchInputHtml)}
                    {(menuHtmlMobile)}
                </div>

                <div class="container-fluid main">
                    <div class="row main">
                        <div class="d-none d-md-block menu">
                            {(menuHtml)}
                        </div>
                        {/* START CONTENT */}
                        <div class={`content ${data.context}`}>
                            <div class="content-data">
                                {(content)}
                            </div>
                            {(searchResultsHtml)}
                        </div>
                        {/* END CONTENT */}
                    </div>
                </div>

                {!data.hideDarkModeToggle && <DarkModeToggle />}

                <PageGlobals data={data} />

                {!data.disableSearch && (
                    <script src={r('js/search/search.js')}></script>
                )}
                <script src={r('js/lazy-load-graphs.js')}></script>

                {data.gaID && <GoogleAnalytics gaID={data.gaID} gaSite={data.gaSite!} />}
            </body>
        </html>
    ) as string;
};
