import Html from '@kitajs/html';
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

export const Modules = (props: ModulesProps): string => (
    <>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('modules')}</li>
        </ol>
        <div class="container-fluid modules">
            <div class="row">
                {props.modules.map(mod => (
                    <div class="col-md-6 col-lg-4">
                        <div class="card card-module">
                            <div class="card-header">
                                <h4 class="card-title">{mod.name}</h4>
                            </div>
                            <div class="card-block">
                                {!props.disableGraph && (
                                    mod.graph
                                        ? <p>{lazyGraphObject(mod.name)}</p>
                                        : <p class="no-graph">{t('no-graph')}</p>
                                )}
                                <footer class="text-center">
                                    <a href={`./modules/${mod.name}.html`} class="btn btn-default">{t('browse')}</a>
                                </footer>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </>
) as string;
