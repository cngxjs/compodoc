import type { IHtmlEngineHelper } from './html-engine-helper.interface';

export class IndexableSignatureHelper implements IHtmlEngineHelper {
    public helperFunc(_context: any, method) {
        const args = method.args.map(arg => `${arg.name}: ${arg.type}`).join(', ');
        if (method.name) {
            return `${method.name}[${args}]`;
        } else {
            return `[${args}]`;
        }
    }
}
