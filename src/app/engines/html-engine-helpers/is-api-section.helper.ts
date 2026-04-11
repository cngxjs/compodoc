import Configuration from '../../configuration';
import { DEFAULT_API_SECTIONS } from '../../../utils/constants';
import type { IHandlebarsOptions, IHtmlEngineHelper } from './html-engine-helper.interface';

/**
 * Handlebars mirror of `src/templates/helpers/tab-helpers.ts#isApiSection`.
 *
 * Resolution:
 * - `apiTabSections` set → only those sections go on API.
 * - otherwise → `DEFAULT_API_SECTIONS`.
 */
export class IsApiSectionHelper implements IHtmlEngineHelper {
    public helperFunc(context: any, sectionId: string, options: IHandlebarsOptions) {
        const sections = Configuration.mainData.apiTabSections;
        const matches =
            Array.isArray(sections) && sections.length > 0
                ? sections.includes(sectionId)
                : DEFAULT_API_SECTIONS.includes(sectionId);
        return matches ? options.fn(context) : options.inverse(context);
    }
}
