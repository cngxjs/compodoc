import Handlebars from 'handlebars';

import { highlightCode } from '../syntax-highlight.engine';
import { IHtmlEngineHelper } from './html-engine-helper.interface';

export class HighlightCodeHelper implements IHtmlEngineHelper {
    public helperFunc(context: unknown, code: string, lang?: string): Handlebars.SafeString {
        const language = typeof lang === 'string' ? lang : 'typescript';
        return new Handlebars.SafeString(highlightCode(code, language));
    }
}
