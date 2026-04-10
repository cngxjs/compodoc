import {
    MetadataChipsRow,
    MetadataCodeRow,
    MetadataRow,
    MetadataSection
} from '../blocks/MetadataRow';
import { isInfoSection, linkTypeHtml, t } from '../helpers';
import { renderEntityPage } from './EntityPage';

const DirectiveMetadata = (directive: any): string => {
    if (!isInfoSection('metadata')) {
        return '';
    }
    const hasMetadata =
        directive.selector ||
        directive.providers?.length > 0 ||
        directive.hostDirectives?.length > 0 ||
        directive.exportAs;
    const hasExtends = directive.extends?.length > 0;
    const hasImplements = directive.implements?.length > 0;
    if (!hasMetadata && !hasExtends && !hasImplements) {
        return '';
    }

    const rows: string[] = [];

    if (directive.selector) {
        rows.push(MetadataCodeRow('selector', directive.selector));
    }
    if (directive.exportAs) {
        rows.push(MetadataCodeRow('exportAs', directive.exportAs));
    }

    // Array values → chip rows (same treatment as ComponentPage)
    rows.push(MetadataChipsRow('providers', directive.providers ?? []));

    if (directive.hostDirectives?.length > 0) {
        rows.push(
            MetadataRow(
                'hostDirectives',
                directive.hostDirectives
                    .map((hd: any) => {
                        let html = linkTypeHtml(hd.name);
                        if (hd.inputs?.length > 0) {
                            html += ` <span class="cdx-metadata-label">${t('inputs')}:</span> ${hd.inputs.join(', ')}`;
                        }
                        if (hd.outputs?.length > 0) {
                            html += ` <span class="cdx-metadata-label">${t('outputs')}:</span> ${hd.outputs.join(', ')}`;
                        }
                        return html;
                    })
                    .join(' ')
            )
        );
    }

    rows.push(MetadataChipsRow('extends', (directive.extends as string[]) ?? []));
    rows.push(MetadataChipsRow('implements', (directive.implements as string[]) ?? []));

    return MetadataSection({ rows });
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
        sourceCode: data.directive?.sourceCode
    });
