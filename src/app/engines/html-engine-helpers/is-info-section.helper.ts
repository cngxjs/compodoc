import Configuration from '../../configuration';
import type { IHandlebarsOptions, IHtmlEngineHelper } from './html-engine-helper.interface';

export class IsInfoSectionHelper implements IHtmlEngineHelper {
    public helperFunc(context: any, sectionId: string, options: IHandlebarsOptions) {
        const sections = Configuration.mainData.infoTabSections;
        // Empty array = show all (backward compat)
        if (!sections || sections.length === 0) {
            return options.fn(context);
        }
        return sections.includes(sectionId) ? options.fn(context) : options.inverse(context);
    }
}
