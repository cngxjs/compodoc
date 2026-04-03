import Html from '@kitajs/html';
import { renderEntityPage } from './EntityPage';

const TokenMetadata = (injectable: any): string => {
    if (!injectable.isToken) return '';
    const rows: string[] = [];
    if (injectable.tokenType) {
        rows.push(<tr><td class="col-md-3">Type</td><td class="col-md-9"><code>{injectable.tokenType}</code></td></tr> as string);
    }
    if (injectable.providedIn) {
        rows.push(<tr><td class="col-md-3">Provided in</td><td class="col-md-9"><code>{injectable.providedIn}</code></td></tr> as string);
    }
    if (rows.length === 0) return '';
    return (
        <section data-compodoc="block-metadata">
            <h3>Token Metadata</h3>
            <table class="table table-sm table-hover metadata">
                <tbody>{rows.join('')}</tbody>
            </table>
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
        showTokenBadge: true,
        showJsdocBadges: true,
        metadataHtml: TokenMetadata(data.injectable),
    });
