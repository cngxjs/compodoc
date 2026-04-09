import Handlebars from 'handlebars';
import type { IHtmlEngineHelper } from './html-engine-helper.interface';

export class BreakLinesHelper implements IHtmlEngineHelper {
    constructor(private bars) {}

    public helperFunc(_context: any, text: string) {
        text = this.bars.Utils.escapeExpression(text);
        text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
        text = text.replace(/ /gm, '&nbsp;');
        text = text.replace(/	/gm, '&nbsp;&nbsp;&nbsp;&nbsp;');
        return new Handlebars.SafeString(text);
    }
}
