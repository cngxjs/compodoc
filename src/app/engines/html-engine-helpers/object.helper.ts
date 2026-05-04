import Handlebars from 'handlebars';
import type { IHtmlEngineHelper } from './html-engine-helper.interface';

export class ObjectHelper implements IHtmlEngineHelper {
    public helperFunc(_context: any, text: string) {
        text = JSON.stringify(text);
        text = text.replace(/{"/, '{<br>&nbsp;&nbsp;&nbsp;&nbsp;"');
        text = text.replace(/,"/, ',<br>&nbsp;&nbsp;&nbsp;&nbsp;"');
        text = text.replace(/}$/, '<br>}');
        return new Handlebars.SafeString(text);
    }
}
