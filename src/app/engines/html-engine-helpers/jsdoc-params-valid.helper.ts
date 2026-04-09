import type { JsdocTagInterface } from '../../interfaces/jsdoc-tag.interface';
import type { IHandlebarsOptions, IHtmlEngineHelper } from './html-engine-helper.interface';

export class JsdocParamsValidHelper implements IHtmlEngineHelper {
    public helperFunc(context: any, jsdocTags: JsdocTagInterface[], options: IHandlebarsOptions) {
        let i = 0;
        const len = jsdocTags.length;
        const _tags = [];
        let valid = false;

        for (i; i < len; i++) {
            if (jsdocTags[i].tagName) {
                if (jsdocTags[i].tagName.text === 'param') {
                    valid = true;
                }
            }
        }
        if (valid) {
            return options.fn(context);
        } else {
            return options.inverse(context);
        }
    }
}
