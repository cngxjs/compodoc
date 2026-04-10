import type { IHtmlEngineHelper } from './html-engine-helper.interface';

export class StripURLHelper implements IHtmlEngineHelper {
    public helperFunc(_context: any, prefix: string, url: string, _options): string {
        return prefix + url.split('/').pop();
    }
}
