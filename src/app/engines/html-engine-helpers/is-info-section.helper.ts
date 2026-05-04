import { DEFAULT_INFO_SECTIONS } from '../../../utils/constants';
import Configuration from '../../configuration';
import type { IHandlebarsOptions, IHtmlEngineHelper } from './html-engine-helper.interface';

/**
 * Handlebars mirror of `src/templates/helpers/tab-helpers.ts#isInfoSection`.
 *
 * Resolution:
 * - `infoTabSections` set → only those sections go on Info.
 * - otherwise → `DEFAULT_INFO_SECTIONS` (new Info/API split default).
 */
export class IsInfoSectionHelper implements IHtmlEngineHelper {
    public helperFunc(context: any, sectionId: string, options: IHandlebarsOptions) {
        const sections = Configuration.mainData.infoTabSections;
        const matches =
            Array.isArray(sections) && sections.length > 0
                ? sections.includes(sectionId)
                : DEFAULT_INFO_SECTIONS.includes(sectionId);
        return matches ? options.fn(context) : options.inverse(context);
    }
}
