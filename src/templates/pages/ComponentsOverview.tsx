import Html from '@kitajs/html';
import { linkTypeHtml, t } from '../helpers';

type ComponentOverviewItem = {
    readonly name: string;
    readonly selector?: string;
    readonly standalone?: boolean;
    readonly beta?: boolean;
    readonly since?: string;
    readonly zoneless?: boolean;
    readonly deprecated?: boolean;
    readonly description?: string;
    readonly imports?: Array<{ name: string }>;
};

type ComponentsOverviewProps = {
    readonly components: ComponentOverviewItem[];
    readonly directives?: ComponentOverviewItem[];
    readonly pipes?: any[];
};

const EntityBadges = (item: ComponentOverviewItem): string => {
    const badges: string[] = [];
    if (item.standalone) badges.push(<span class="cdx-badge cdx-badge--standalone">Standalone</span> as string);
    if (item.zoneless) badges.push(<span class="cdx-badge cdx-badge--zoneless">Zoneless</span> as string);
    if (item.beta) badges.push(<span class="cdx-badge cdx-badge--beta">Beta</span> as string);
    if (item.since) badges.push(<span class="cdx-badge cdx-badge--since">v{item.since}</span> as string);
    return badges.join('');
};

const ComponentCard = (item: ComponentOverviewItem, type: string): string => (
    <div class="col-sm-6 col-lg-4">
        <div class={`card card-module cdx-entity-card cdx-entity-card--${type}`}>
            <div class="card-header">
                <h4 class={`card-title ${item.deprecated ? 'deprecated-name' : ''}`}>
                    {item.name}
                    {EntityBadges(item)}
                </h4>
                {item.selector && <code class="cdx-card-selector">{item.selector}</code>}
            </div>
            <div class="card-block">
                {item.description && (
                    <p class="cdx-card-description">{item.description.replace(/<[^>]+>/g, '').substring(0, 120)}{item.description.length > 120 ? '...' : ''}</p>
                )}
                {item.imports?.length > 0 && (
                    <div class="cdx-card-imports">
                        <small>Imports: {item.imports.slice(0, 5).map((imp: any) => linkTypeHtml(imp.name)).join(', ')}{item.imports.length > 5 ? ` +${item.imports.length - 5}` : ''}</small>
                    </div>
                )}
                <footer class="text-center">
                    <a href={`./${type}s/${item.name}.html`} class="btn btn-default">{t('browse')}</a>
                </footer>
            </div>
        </div>
    </div>
) as string;

export const ComponentsOverview = (props: ComponentsOverviewProps): string => (
    <>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">Components</li>
        </ol>

        {props.components?.length > 0 && (<>
            <h3>Components ({props.components.length})</h3>
            <div class="container-fluid modules">
                <div class="row">
                    {props.components.map(c => ComponentCard(c, 'component'))}
                </div>
            </div>
        </>)}

        {props.directives?.length > 0 && (<>
            <h3>Directives ({props.directives.length})</h3>
            <div class="container-fluid modules">
                <div class="row">
                    {props.directives.map(d => ComponentCard(d, 'directive'))}
                </div>
            </div>
        </>)}

        {props.pipes?.length > 0 && (<>
            <h3>Pipes ({props.pipes.length})</h3>
            <div class="container-fluid modules">
                <div class="row">
                    {props.pipes.map(p => ComponentCard(p, 'pipe'))}
                </div>
            </div>
        </>)}
    </>
) as string;
