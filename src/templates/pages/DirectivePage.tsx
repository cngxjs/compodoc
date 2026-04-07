import Html from '@kitajs/html';
import { isInfoSection, linkTypeHtml, t } from '../helpers';
import { renderEntityPage } from './EntityPage';

const DirectiveMetadata = (directive: any): string => {
    if (!isInfoSection('metadata')) return '';
    const hasMetadata = directive.selector || directive.providers || directive.standalone || directive.hostDirectives || directive.exportAs;
    const hasExtends = directive.extends?.length > 0;
    const hasImplements = directive.implements?.length > 0;
    if (!hasMetadata && !hasExtends && !hasImplements) return '';

    const rows: string[] = [];

    if (directive.selector) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">{t('selector')}</dt><dd class="cdx-metadata-value"><code>{directive.selector}</code></dd></div> as string);
    }
    if (directive.standalone) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">{t('standalone')}</dt><dd class="cdx-metadata-value"><code>{String(directive.standalone)}</code></dd></div> as string);
    }
    if (directive.exportAs) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">{t('exportAs')}</dt><dd class="cdx-metadata-value"><code>{directive.exportAs}</code></dd></div> as string);
    }
    if (directive.providers) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">{t('providers')}</dt><dd class="cdx-metadata-value"><code>{directive.providers.map((p: any) => p.name).join(', ')}</code></dd></div> as string);
    }
    if (directive.hostDirectives?.length > 0) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">{t('hostdirectives')}</dt><dd class="cdx-metadata-value">{directive.hostDirectives.map((hd: any) => {
            let html = linkTypeHtml(hd.name);
            if (hd.inputs?.length > 0) html += ` <span class="cdx-metadata-label">${t('inputs')}:</span> ${hd.inputs.join(', ')}`;
            if (hd.outputs?.length > 0) html += ` <span class="cdx-metadata-label">${t('outputs')}:</span> ${hd.outputs.join(', ')}`;
            return html;
        }).join(' ')}</dd></div> as string);
    }
    if (hasExtends) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">extends</dt><dd class="cdx-metadata-value">{(directive.extends as string[]).map((ext: string) => linkTypeHtml(ext)).join(' ')}</dd></div> as string);
    }
    if (hasImplements) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">implements</dt><dd class="cdx-metadata-value">{(directive.implements as string[]).map((impl: string) => linkTypeHtml(impl)).join(' ')}</dd></div> as string);
    }

    return (
        <section class="cdx-content-section" data-compodoc="block-metadata">
            <h3 class="cdx-section-heading">{t('metadata')}</h3>
            <dl class="cdx-metadata-card">
                {rows.join('')}
            </dl>
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
        showExtends: false,
        showIndex: true,
        showConstructor: true,
        showInputs: true,
        showOutputs: true,
        showHostBindings: true,
        showHostListeners: true,
        showMethods: true,
        showProperties: true,
        showAccessors: true,
        contextLine: data.directive?.selector,
        showStandaloneBadge: true,
        showJsdocBadges: true,
        relationships: data.relationships,
    });
