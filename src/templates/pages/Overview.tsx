import Html from '@kitajs/html';
import { t } from '../helpers';
import { iconFor } from '../components/Icons';
import { EmptyState } from '../components/EmptyState';
import { EmptyIconDashboard } from '../components/EmptyStateIcons';
import { OverviewHero } from '../blocks/OverviewHero';
import { OverviewStats } from '../blocks/OverviewStats';

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
    readonly coverageData?: { files?: any[]; count?: number };
    readonly angularVersion?: string;
    readonly generatedAt?: string;
    readonly documentationMainName?: string;
    readonly dependencyGraph?: { nodes: any[]; edges: any[] };
};

const hasAnyEntities = (props: OverviewProps): boolean =>
    !!(
        props.modules?.length ||
        props.components?.length ||
        props.entities?.length ||
        props.directives?.length ||
        props.injectables?.length ||
        props.interceptors?.length ||
        props.pipes?.length ||
        props.classes?.length ||
        props.guards?.length ||
        props.interfaces?.length ||
        props.routes?.length ||
        props.appConfig?.length
    );

export const Overview = (props: OverviewProps): string => {
    const hasModules = (props.modules?.length ?? 0) > 0;
    const showGraph = !props.disableGraph && !props.disableMainGraph && hasModules;
    const hasDepGraph = (props.dependencyGraph?.nodes?.length ?? 0) > 0;
    const showDepGraph = !props.disableGraph && !hasModules && hasDepGraph;

    return (
        <>
            {/* 1. Project Summary Hero */}
            {OverviewHero({
                projectName: props.documentationMainName || t('overview'),
                angularVersion: props.angularVersion || undefined,
                hasZoneless: [
                    ...(props.components as any[] ?? []),
                    ...(props.directives as any[] ?? [])
                ].some((e: any) => e.zoneless),
                generatedAt: props.generatedAt || new Date().toISOString()
            })}

            {/* 2. Module Graph (NgModule apps only) */}
            {showGraph && (
                <div class="text-center module-graph-container">
                    <div id="module-graph-svg">
                        {props.mainGraph}
                    </div>
                    <button id="fullscreen" class="module-graph-fullscreen-btn" aria-label="Fullscreen">
                        {iconFor('ion-ios-resize')}
                    </button>
                    <div class="btn-group size-buttons">
                        <button id="zoom-in" class="cdx-btn cdx-btn--sm">{t('zoomin')}</button>
                        <button id="reset" class="cdx-btn cdx-btn--sm">{t('reset')}</button>
                        <button id="zoom-out" class="cdx-btn cdx-btn--sm">{t('zoomout')}</button>
                    </div>
                </div>
            )}

            {/* 2b. Dependency Graph (standalone apps without NgModules) */}
            {showDepGraph && (<>
                <script>{`window.DEPENDENCY_GRAPH = ${JSON.stringify(props.dependencyGraph)};`}</script>
                <div class="text-center module-graph-container">
                    <div id="dependency-graph-container"></div>
                    <div class="btn-group size-buttons">
                        <button id="dep-zoom-in" class="cdx-btn cdx-btn--sm">{t('zoomin')}</button>
                        <button id="dep-reset" class="cdx-btn cdx-btn--sm">{t('reset')}</button>
                        <button id="dep-zoom-out" class="cdx-btn cdx-btn--sm">{t('zoomout')}</button>
                    </div>
                </div>
            </>)}

            {/* 3. Stats Grid or Empty State */}
            {hasAnyEntities(props)
                ? OverviewStats({
                    modules: props.modules as any[],
                    components: props.components as any[],
                    directives: props.directives as any[],
                    injectables: props.injectables as any[],
                    pipes: props.pipes as any[],
                    classes: props.classes as any[],
                    guards: props.guards as any[],
                    interfaces: props.interfaces as any[],
                    interceptors: props.interceptors as any[],
                    entities: props.entities as any[],
                    routes: props.routes as any[],
                    routesLength: props.routesLength,
                    appConfig: props.appConfig,
                    coverageData: props.coverageData
                })
                : EmptyState({
                    icon: EmptyIconDashboard(),
                    title: t('empty-overview-title'),
                    description: t('empty-overview-desc'),
                    action: {
                        label: t('empty-overview-action'),
                        href: 'https://compodocx.dev/guide/getting-started'
                    },
                    variant: 'page'
                })
            }
        </>
    ) as string;
};
