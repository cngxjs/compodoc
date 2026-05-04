import { SyntaxKind, type ts } from 'ts-morph';

export class CodeGenerator {
    public generate(node: ts.Node): string {
        return this.visitAndRecognize(node, []).join('');
    }

    private visitAndRecognize(node: ts.Node, code: Array<string>, depth = 0): Array<string> {
        this.recognize(node, code);
        node.getChildren().forEach(c => this.visitAndRecognize(c, code, depth + 1));
        return code;
    }

    private recognize(node: ts.Node, code: Array<string>) {
        const conversion = TsKindConversion.find(x => x.kinds.some(z => z === node.kind));

        if (conversion) {
            const result = conversion.output(node);
            result.forEach(text => this.gen(text, code));
        }
    }

    private gen(token: string | undefined, code: Array<string>): void {
        if (!token) {
            return;
        }

        if (token === '\n') {
            code.push('');
        } else {
            code.push(token);
        }
    }
}

class TsKindsToText {
    constructor(
        public output: (node: ts.Node) => Array<string>,
        public kinds: Array<SyntaxKind>
    ) {}
}

const TsKindConversion: Array<TsKindsToText> = [
    new TsKindsToText(
        node => ['"', (node as any).text, '"'],
        [SyntaxKind.FirstLiteralToken, SyntaxKind.Identifier]
    ),
    new TsKindsToText(node => ['"', (node as any).text, '"'], [SyntaxKind.StringLiteral]),
    new TsKindsToText(_node => [], [SyntaxKind.ArrayLiteralExpression]),
    new TsKindsToText(_node => ['import', ' '], [SyntaxKind.ImportKeyword]),
    new TsKindsToText(_node => ['from', ' '], [SyntaxKind.FromKeyword]),
    new TsKindsToText(_node => ['\n', 'export', ' '], [SyntaxKind.ExportKeyword]),
    new TsKindsToText(_node => ['class', ' '], [SyntaxKind.ClassKeyword]),
    new TsKindsToText(_node => ['this'], [SyntaxKind.ThisKeyword]),
    new TsKindsToText(_node => ['constructor'], [SyntaxKind.ConstructorKeyword]),
    new TsKindsToText(_node => ['false'], [SyntaxKind.FalseKeyword]),
    new TsKindsToText(_node => ['true'], [SyntaxKind.TrueKeyword]),
    new TsKindsToText(_node => ['null'], [SyntaxKind.NullKeyword]),
    new TsKindsToText(_node => [], [SyntaxKind.AtToken]),
    new TsKindsToText(_node => ['+'], [SyntaxKind.PlusToken]),
    new TsKindsToText(_node => [' => '], [SyntaxKind.EqualsGreaterThanToken]),
    new TsKindsToText(_node => ['('], [SyntaxKind.OpenParenToken]),
    new TsKindsToText(
        _node => ['{', ' '],
        [SyntaxKind.ImportClause, SyntaxKind.ObjectLiteralExpression]
    ),
    new TsKindsToText(_node => ['{', '\n'], [SyntaxKind.Block]),
    new TsKindsToText(_node => ['}'], [SyntaxKind.CloseBraceToken]),
    new TsKindsToText(_node => [')'], [SyntaxKind.CloseParenToken]),
    new TsKindsToText(_node => ['['], [SyntaxKind.OpenBracketToken]),
    new TsKindsToText(_node => [']'], [SyntaxKind.CloseBracketToken]),
    new TsKindsToText(_node => [';', '\n'], [SyntaxKind.SemicolonToken]),
    new TsKindsToText(_node => [',', ' '], [SyntaxKind.CommaToken]),
    new TsKindsToText(_node => [' ', ':', ' '], [SyntaxKind.ColonToken]),
    new TsKindsToText(_node => ['.'], [SyntaxKind.DotToken]),
    new TsKindsToText(_node => [], [SyntaxKind.DoStatement]),
    new TsKindsToText(_node => [], [SyntaxKind.Decorator]),
    new TsKindsToText(_node => [' = '], [SyntaxKind.FirstAssignment]),
    new TsKindsToText(_node => [' '], [SyntaxKind.FirstPunctuation]),
    new TsKindsToText(_node => ['private', ' '], [SyntaxKind.PrivateKeyword]),
    new TsKindsToText(_node => ['public', ' '], [SyntaxKind.PublicKeyword])
];
