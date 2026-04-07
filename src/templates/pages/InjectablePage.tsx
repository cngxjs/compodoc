import Html from '@kitajs/html';
import { renderEntityPage } from './EntityPage';

const TokenMetadata = (injectable: any): string => {
    if (!injectable.isToken) return '';
    const rows: string[] = [];
    if (injectable.tokenType) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">Type</dt><dd class="cdx-metadata-value"><code>{injectable.tokenType}</code></dd></div> as string);
    }
    if (injectable.providedIn) {
        rows.push(<div class="cdx-metadata-row"><dt class="cdx-metadata-label">Provided in</dt><dd class="cdx-metadata-value"><code>{injectable.providedIn}</code></dd></div> as string);
    }
    if (rows.length === 0) return '';
    return (
        <section class="cdx-content-section" data-compodoc="block-metadata">
            <h3 class="cdx-section-heading">Token Metadata</h3>
            <dl class="cdx-metadata-card">
                {rows.join('')}
            </dl>
        </section>
    ) as string;
};

export const InjectablePage = (data: any): string =>
    renderEntityPage({
        entity: data.injectable,
        entityKey: 'injectable',
        breadcrumbLabel: 'injectables',
        depth: data.depth,
        navTabs: data.navTabs,
        disableFilePath: data.disableFilePath,
        showExtends: true,
        showIndex: true,
        showConstructor: true,
        showMethods: true,
        showProperties: true,
        showAccessors: true,
        contextLine: data.injectable?.providedIn ? 'providedIn: ' + JSON.stringify(data.injectable.providedIn) : undefined,
        showTokenBadge: true,
        showJsdocBadges: true,
        metadataHtml: TokenMetadata(data.injectable),
        relationships: data.relationships,
    });
