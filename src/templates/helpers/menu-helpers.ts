import Configuration from '../../app/configuration';
import DependenciesEngine from '../../app/engines/dependencies.engine';

/**
 * Check if a menu section should be initially expanded.
 * "all" in toggleMenuItems means everything is expanded.
 * A specific type in toggleMenuItems means that type is expanded.
 */
export const isToggled = (type: string): boolean => {
    const items = Configuration.mainData.toggleMenuItems;
    if (items.indexOf('all') !== -1) {
        return true;
    }
    return items.indexOf(type) !== -1;
};

/**
 * Filter elements that are NOT declared in any module.
 * Used for standalone components/directives/injectables/pipes sections.
 */
export const getAloneElements = (elements: any[]): any[] => {
    const modules = DependenciesEngine.modules;
    return elements.filter(element => {
        for (const mod of modules) {
            for (const decl of mod.declarations ?? []) {
                if (decl.id === element.id || decl.file === element.file) {
                    return false;
                }
            }
            for (const boot of mod.bootstrap ?? []) {
                if (boot.id === element.id || boot.file === element.file) {
                    return false;
                }
            }
            for (const prov of mod.providers ?? []) {
                if (prov.id === element.id || prov.file === element.file) {
                    return false;
                }
            }
        }
        return true;
    });
};

/** Strip path prefix: 'images/' + 'foo/bar/logo.png' -> 'images/logo.png' */
export const stripUrl = (prefix: string, url: string): string => prefix + url.split('/').pop();
