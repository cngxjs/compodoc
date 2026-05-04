import Handlebars from 'handlebars';
import type { IHtmlEngineHelper } from './html-engine-helper.interface';

export class CleanParagraphHelper implements IHtmlEngineHelper {
    public helperFunc(_context: any, text: string) {
        text = text.replace(/<p>/gm, '');
        text = text.replace(/<\/p>/gm, '');
        return new Handlebars.SafeString(text);
    }
}
