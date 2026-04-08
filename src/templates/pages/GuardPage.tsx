import Html from '@kitajs/html';
import { renderEntityPage } from './EntityPage';

export const GuardPage = (data: any): string =>
    renderEntityPage({
        entity: data.injectable,
        entityKey: 'guard',
        breadcrumbLabel: 'guards',
        depth: data.depth,
        navTabs: data.navTabs,
        disableFilePath: data.disableFilePath,
        showExtends: true,
        showIndex: true,
        showConstructor: true,
        showMethods: true,
        showProperties: true,
        showAccessors: true,
        contextLine: data.injectable?.functionalKind
            ? `Functional ${data.injectable.functionalKind}`
            : undefined,
        showJsdocBadges: true
    });
