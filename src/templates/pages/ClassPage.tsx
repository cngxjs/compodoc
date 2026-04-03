import Html from '@kitajs/html';
import { renderEntityPage } from './EntityPage';

export const ClassPage = (data: any): string =>
    renderEntityPage({
        entity: data.class,
        entityKey: 'class',
        breadcrumbLabel: 'classes',
        depth: data.depth,
        navTabs: data.navTabs,
        disableFilePath: data.disableFilePath,
        showExtends: true,
        showIndex: true,
        showConstructor: true,
        showInputs: true,
        showOutputs: true,
        showHostBindings: true,
        showHostListeners: true,
        showMethods: true,
        showProperties: true,
        showIndexSignatures: true,
        showAccessors: true,
        showJsdocBadges: true,
    });
