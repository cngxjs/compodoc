import Handlebars from 'handlebars';
import { IHtmlEngineHelper } from './html-engine-helper.interface';

export class CapitalizeHelper implements IHtmlEngineHelper {
    public helperFunc(context: any, text: string) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
}
