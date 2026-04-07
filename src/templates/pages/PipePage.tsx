import Html from '@kitajs/html';
import { isInfoSection, t } from '../helpers';
import { renderEntityPage } from './EntityPage';

const PipeMetadata = (pipe: any): string => {
    if (!isInfoSection('metadata')) return '';
    const rows: string[] = [];

    if (pipe.ngname) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">{t('name')}</dt><dd class="cdx-metadata-value"><code>{pipe.ngname}</code></dd></div> as string);
    }
    if (pipe.pure) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">{t('pure')}</dt><dd class="cdx-metadata-value"><code>{String(pipe.pure)}</code></dd></div> as string);
    }
    if (pipe.standalone) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">{t('standalone')}</dt><dd class="cdx-metadata-value"><code>{String(pipe.standalone)}</code></dd></div> as string);
    }

    if (rows.length === 0) return '';

    return (
        <section class="cdx-content-section" data-compodoc="block-metadata">
            <h3 class="cdx-section-heading">{t('metadata')}</h3>
            <dl class="cdx-metadata-card">
                {rows.join('')}
            </dl>
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
        contextLine: data.pipe?.name ? '{{ value | ' + data.pipe.name + ' }}' : undefined,
        showStandaloneBadge: true,
        showJsdocBadges: true,
        relationships: data.relationships,
        sourceCode: data.pipe?.sourceCode,
    });
