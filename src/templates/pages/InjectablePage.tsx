import Html from '@kitajs/html';
import { renderEntityPage } from './EntityPage';

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
    });
