import Handlebars from 'handlebars';
import type { IHtmlEngineHelper } from './html-engine-helper.interface';

export class BreakCommaHelper implements IHtmlEngineHelper {
    constructor(private readonly bars) {}

    public helperFunc(_context: any, text: string) {
        text = this.bars.Utils.escapeExpression(text);
        text = text.replaceAll(',', ',<br>');
        return new Handlebars.SafeString(text);
    }
}
