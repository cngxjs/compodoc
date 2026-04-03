import Html from '@kitajs/html';
import { isInfoSection, linkTypeHtml, t } from '../helpers';
import { renderEntityPage } from './EntityPage';

const DirectiveMetadata = (directive: any): string => {
    if (!isInfoSection('metadata')) return '';
    const hasMetadata = directive.selector || directive.providers || directive.standalone || directive.hostDirectives;
    if (!hasMetadata) return '';

    return (
        <section data-compodoc="block-metadata">
            <h3>{t('metadata')}</h3>
            <table class="table table-sm table-hover metadata">
                <tbody>
                    {directive.providers && (
                        <tr>
                            <td class="col-md-3">{t('providers')}</td>
                            <td class="col-md-9"><code>{directive.providers.map((p: any) => p.name).join(' ')}</code></td>
                        </tr>
                    )}
                    {directive.selector && (
                        <tr>
                            <td class="col-md-3">{t('selector')}</td>
                            <td class="col-md-9"><code>{directive.selector}</code></td>
                        </tr>
                    )}
                    {directive.standalone && (
                        <tr>
                            <td class="col-md-3">{t('standalone')}</td>
                            <td class="col-md-9"><code>{String(directive.standalone)}</code></td>
                        </tr>
                    )}
                    {directive.hostDirectives && (
                        <tr>
                            <td class="col-md-3">{t('hostdirectives')}</td>
                            <td class="col-md-9">
                                {directive.hostDirectives.map((hd: any) => (<>
                                    {linkTypeHtml(hd.name)}<br />
                                    {hd.inputs?.length > 0 && (
                                        <div><i>&nbsp;{t('inputs')}</i> : {hd.inputs.join(' ')}</div>
                                    )}
                                    {hd.outputs?.length > 0 && (
                                        <div><i>&nbsp;{t('outputs')}</i> : {hd.outputs.join(' ')}</div>
                                    )}
                                </>))}
                            </td>
                        </tr>
                    )}
                    {directive.exportAs && (
                        <tr>
                            <td class="col-md-3">{t('exportAs')}</td>
                            <td class="col-md-9"><code>{directive.exportAs}</code></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    ) as string;
};

export const DirectivePage = (data: any): string =>
    renderEntityPage({
        entity: data.directive,
        entityKey: 'directive',
        breadcrumbLabel: 'directives',
        depth: data.depth,
        navTabs: data.navTabs,
        disableFilePath: data.disableFilePath,
        metadataHtml: DirectiveMetadata(data.directive),
        showExtends: true,
        showIndex: true,
        showConstructor: true,
        showInputs: true,
        showOutputs: true,
        showHostBindings: true,
        showHostListeners: true,
        showMethods: true,
        showProperties: true,
        showAccessors: true,
        showStandaloneBadge: true,
        showJsdocBadges: true,
    });
