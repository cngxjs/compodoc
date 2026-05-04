import Html from '@kitajs/html';
import { EmptyState } from '../components/EmptyState';
import { EmptyIconTree } from '../components/EmptyStateIcons';
import { t } from '../helpers';

type ModuleItem = {
    readonly name: string;
    readonly graph?: boolean;
};

type ModulesProps = {
    readonly modules: ModuleItem[];
    readonly disableGraph?: boolean;
};

/** Renders the SVG object tag with a custom `lazy` attribute (loaded by IntersectionObserver in graphs.ts). */
const lazyGraphObject = (name: string): string =>
    `<object id="demo-svg" type="image/svg+xml" lazy="./modules/${name}/dependencies.svg" style="width: 100%; height: 175px;">${t('no-svg')}</object>`;

export const Modules = (props: ModulesProps): string =>
    (
        <>
            <ol class="cdx-breadcrumb">
                <li class="">{t('modules')}</li>
            </ol>
            <div class="cdx-modules-grid">
                {props.modules.map(mod => (
                    <div class="cdx-module-card">
                        <h4>{mod.name}</h4>
                        <div class="cdx-module-card-body">
                            {!props.disableGraph &&
                                (mod.graph ? (
                                    <p>{lazyGraphObject(mod.name)}</p>
                                ) : (
                                    EmptyState({
                                        icon: EmptyIconTree(),
                                        title: t('no-graph'),
                                        variant: 'full'
                                    })
                                ))}
                        </div>
                        <div class="cdx-module-card-footer">
                            <a href={`./modules/${mod.name}.html`} class="cdx-btn cdx-btn--default">
                                {t('browse')}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </>
    ) as string;
