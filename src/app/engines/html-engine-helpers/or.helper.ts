import type { IHandlebarsOptions, IHtmlEngineHelper } from './html-engine-helper.interface';

export class OrHelper implements IHtmlEngineHelper {
    public helperFunc(context: any, ...args: any[]) {
        const len = args.length;
        const options: IHandlebarsOptions = args[len - 1];

        // We start at 0 because args excludes context
        for (let i = 0; i < len - 1; i++) {
            if (args[i]) {
                return options.fn(context);
            }
        }

        return options.inverse(context);
    }
}
