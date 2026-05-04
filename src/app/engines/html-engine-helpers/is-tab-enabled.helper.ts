import type { IHandlebarsOptions, IHtmlEngineHelper } from './html-engine-helper.interface';

export class IsTabEnabledHelper implements IHtmlEngineHelper {
    public helperFunc(context: any, tabs: Array<any>, tabId: string, options: IHandlebarsOptions) {
        const isTabEnabled = Array.isArray(tabs) && -1 !== tabs.findIndex(tab => tab.id === tabId);
        return isTabEnabled ? options.fn(context) : options.inverse(context);
    }
}
