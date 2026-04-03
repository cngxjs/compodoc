import Html from '@kitajs/html';
import { t } from '../helpers';

type OverviewCard = {
    readonly icon: string;
    readonly count: number;
    readonly singularKey: string;
    readonly pluralKey: string;
    readonly href?: string;
    readonly subtitle?: string;
};

type OverviewProps = {
    readonly modules?: unknown[];
    readonly components?: unknown[];
    readonly entities?: unknown[];
    readonly directives?: unknown[];
    readonly injectables?: unknown[];
    readonly interceptors?: unknown[];
    readonly pipes?: unknown[];
    readonly classes?: unknown[];
    readonly guards?: unknown[];
    readonly interfaces?: unknown[];
    readonly routes?: unknown[];
    readonly routesLength?: number;
    readonly mainGraph?: string;
    readonly disableGraph?: boolean;
    readonly disableMainGraph?: boolean;
    readonly appConfig?: any[];
};

const Card = (props: OverviewCard): string => {
    const label = props.count === 1 ? t(props.singularKey) : t(props.pluralKey);
    const content = props.href
        ? <a href={props.href}>{props.count} {label}</a>
        : <>{props.count} {label}</>;

    return (
        <div class="col-sm-3">
            <div class="card text-center">
                <div class="card-block">
                    <h4 class="card-title"><span class={`icon ${props.icon}`}></span></h4>
                    <p class="card-text">{content}</p>
                    {props.subtitle && <p class="card-text"><small>{props.subtitle}</small></p>}
                </div>
            </div>
        </div>
    ) as string;
};

export const Overview = (props: OverviewProps): string => {
    const cards: OverviewCard[] = [];

    // App config card
    if (props.appConfig?.length)
        cards.push({ icon: 'ion-ios-settings', count: props.appConfig.length, singularKey: 'configuration', pluralKey: 'configurations', href: './app-config.html', subtitle: 'ApplicationConfig' });

    if (props.modules?.length)
        cards.push({ icon: 'ion-ios-archive', count: props.modules.length, singularKey: 'module', pluralKey: 'modules', href: './modules.html' });

    if (props.components?.length) {
        const standalone = (props.components as any[]).filter(c => c.standalone).length;
        cards.push({ icon: 'ion-md-cog', count: props.components.length, singularKey: 'component', pluralKey: 'components', subtitle: standalone > 0 ? `${standalone} standalone` : undefined });
    }
    if (props.entities?.length)
        cards.push({ icon: 'ion-md-swap', count: props.entities.length, singularKey: 'entities', pluralKey: 'entities' });
    if (props.directives?.length) {
        const standalone = (props.directives as any[]).filter(d => d.standalone).length;
        cards.push({ icon: 'ion-md-code-working', count: props.directives.length, singularKey: 'directive', pluralKey: 'directives', subtitle: standalone > 0 ? `${standalone} standalone` : undefined });
    }
    if (props.injectables?.length) {
        const tokens = (props.injectables as any[]).filter(i => i.isToken).length;
        cards.push({ icon: 'ion-md-arrow-round-down', count: props.injectables.length, singularKey: 'injectable', pluralKey: 'injectables', subtitle: tokens > 0 ? `${tokens} tokens` : undefined });
    }
    if (props.interceptors?.length)
        cards.push({ icon: 'ion-ios-swap', count: props.interceptors.length, singularKey: 'interceptor', pluralKey: 'interceptors' });
    if (props.pipes?.length)
        cards.push({ icon: 'ion-md-add', count: props.pipes.length, singularKey: 'pipe', pluralKey: 'pipes' });
    if (props.classes?.length)
        cards.push({ icon: 'ion-ios-paper', count: props.classes.length, singularKey: 'classe', pluralKey: 'classes' });
    if (props.guards?.length)
        cards.push({ icon: 'ion-ios-lock', count: props.guards.length, singularKey: 'guard', pluralKey: 'guards' });
    if (props.interfaces?.length)
        cards.push({ icon: 'ion-md-information-circle-outline', count: props.interfaces.length, singularKey: 'interface', pluralKey: 'interfaces' });
    if (props.routes?.length)
        cards.push({ icon: 'ion-ios-git-branch', count: props.routesLength ?? 0, singularKey: 'route', pluralKey: 'routes', href: './routes.html' });

    const hasModules = props.modules?.length > 0;

    return (<>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('overview')}</li>
        </ol>
        {!props.disableGraph && !props.disableMainGraph && hasModules && (
            <div class="text-center module-graph-container">
                <div id="module-graph-svg">
                    {props.mainGraph}
                </div>
                <i id="fullscreen" class="icon ion-ios-resize module-graph-fullscreen-btn" aria-hidden="true"></i>
                <div class="btn-group size-buttons">
                    <button id="zoom-in" class="btn btn-default btn-sm">{t('zoomin')}</button>
                    <button id="reset" class="btn btn-default btn-sm">{t('reset')}</button>
                    <button id="zoom-out" class="btn btn-default btn-sm">{t('zoomout')}</button>
                </div>
            </div>
        )}
        <div class="tab-content overview">
            <div class="row">
                {cards.map(card => Card(card))}
            </div>
        </div>
    </>) as string;
};
