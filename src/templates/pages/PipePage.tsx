import Html from '@kitajs/html';
import { isInfoSection, t } from '../helpers';
import { renderEntityPage } from './EntityPage';

const PipeMetadata = (pipe: any): string => {
    if (!isInfoSection('metadata')) return '';
    return (
        <section data-compodoc="block-metadata">
            <h3>{t('metadata')}</h3>
            <table class="table table-sm table-hover metadata">
                <tbody>
                    {pipe.ngname && (
                        <tr>
                            <td class="col-md-3">{t('name')}</td>
                            <td class="col-md-9">{pipe.ngname}</td>
                        </tr>
                    )}
                    {pipe.pure && (
                        <tr>
                            <td class="col-md-3">{t('pure')}</td>
                            <td class="col-md-9">{String(pipe.pure)}</td>
                        </tr>
                    )}
                    {pipe.standalone && (
                        <tr>
                            <td class="col-md-3">{t('standalone')}</td>
                            <td class="col-md-9"><code>{String(pipe.standalone)}</code></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    ) as string;
};

export const PipePage = (data: any): string =>
    renderEntityPage({
        entity: data.pipe,
        entityKey: 'pipe',
        breadcrumbLabel: 'pipes',
        depth: data.depth,
        navTabs: data.navTabs,
        disableFilePath: data.disableFilePath,
        metadataHtml: PipeMetadata(data.pipe),
        showMethods: true,
        showProperties: true,
        showStandaloneBadge: true,
        showJsdocBadges: true,
    });
