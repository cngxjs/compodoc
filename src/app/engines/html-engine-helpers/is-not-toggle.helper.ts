import Configuration from '../../configuration';
import type { IHtmlEngineHelper } from './html-engine-helper.interface';

export class IsNotToggleHelper implements IHtmlEngineHelper {
    constructor() {}

    public helperFunc(context: any, type, options) {
        const result = Configuration.mainData.toggleMenuItems.indexOf(type);

        if (Configuration.mainData.toggleMenuItems.indexOf('all') !== -1) {
            return options.inverse(context);
        } else if (result !== -1) {
            return options.fn(context);
        } else {
            return options.inverse(context);
        }
    }
}
