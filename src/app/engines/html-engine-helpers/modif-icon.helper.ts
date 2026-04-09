import { SyntaxKind } from 'ts-morph';
import type { IHtmlEngineHelper } from './html-engine-helper.interface';

export class ModifIconHelper implements IHtmlEngineHelper {
    public helperFunc(_context: any, kind: SyntaxKind): string {
        let _kindText = '';
        switch (kind) {
            case SyntaxKind.PrivateKeyword:
                _kindText = 'lock'; // private
                break;
            case SyntaxKind.ProtectedKeyword:
                _kindText = 'lock'; // protected
                break;
            case SyntaxKind.StaticKeyword:
                _kindText = 'reset'; // static
                break;
            case SyntaxKind.ExportKeyword:
                _kindText = 'export'; // export
                break;
            default:
                _kindText = 'reset';
                break;
        }
        return _kindText;
    }
}
