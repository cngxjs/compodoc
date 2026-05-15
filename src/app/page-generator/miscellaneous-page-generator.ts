import { COMPODOC_DEFAULTS } from '../../utils/defaults';
import { logger } from '../../utils/logger';
import Configuration from '../configuration';
import DependenciesEngine from '../engines/dependencies.engine';

export class MiscellaneousPageGenerator {
    public prepare(someMisc?): Promise<any> {
        logger.info('Prepare miscellaneous');
        Configuration.mainData.miscellaneous = someMisc
            ? someMisc
            : DependenciesEngine.getMiscellaneous();

        return new Promise((resolve, _reject) => {
            if (Configuration.mainData.miscellaneous.functions.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'functions',
                    id: 'miscellaneous-functions',
                    context: 'miscellaneous-functions',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            if (Configuration.mainData.miscellaneous.variables.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'variables',
                    id: 'miscellaneous-variables',
                    context: 'miscellaneous-variables',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            if (Configuration.mainData.miscellaneous.typealiases.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'typealiases',
                    id: 'miscellaneous-typealiases',
                    context: 'miscellaneous-typealiases',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            if (Configuration.mainData.miscellaneous.enumerations.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'enumerations',
                    id: 'miscellaneous-enumerations',
                    context: 'miscellaneous-enumerations',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }

            resolve(true);
        });
    }
}
