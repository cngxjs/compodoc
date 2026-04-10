import type { IHtmlEngineHelper } from './html-engine-helper.interface';

export class ShortURLHelper implements IHtmlEngineHelper {
    public helperFunc(_context: any, url: string, _options): string {
        let newUrl = url;
        const firstIndexOfSlash = newUrl.indexOf('/');
        const lastIndexOfSlash = newUrl.lastIndexOf('/');
        if (firstIndexOfSlash !== -1 || lastIndexOfSlash !== -1) {
            newUrl =
                newUrl.substr(0, firstIndexOfSlash + 1) +
                '...' +
                newUrl.substr(lastIndexOfSlash, newUrl.length);
        }
        return newUrl;
    }
}
