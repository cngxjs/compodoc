import Html from '@kitajs/html';
import { renderEntityPage } from './EntityPage';

export const InterceptorPage = (data: any): string =>
    renderEntityPage({
        entity: data.injectable,
        entityKey: 'injectable',
        breadcrumbLabel: 'interceptors',
        depth: data.depth,
        navTabs: data.navTabs,
        disableFilePath: data.disableFilePath,
        showExtends: true,
        showIndex: true,
        showConstructor: true,
        showMethods: true,
        showProperties: true,
        showAccessors: true,
        contextLine: undefined,
        showJsdocBadges: true,
    });
