import type { IHandlebarsOptions, IHtmlEngineHelper } from './html-engine-helper.interface';

export class OneParameterHasHelper implements IHtmlEngineHelper {
    public helperFunc(context: any, tags, typeToCheck): string {
        let result = false;
        const len = arguments.length - 1;
        const options: IHandlebarsOptions = arguments[len];

        let i = 0,
            leng = tags.length;

        for (i; i < leng; i++) {
            if (typeof tags[i][typeToCheck] !== 'undefined' && tags[i][typeToCheck] !== '') {
                result = true;
            }
        }

        if (result) {
            return options.fn(context);
        } else {
            return options.inverse(context);
        }
    }
}
