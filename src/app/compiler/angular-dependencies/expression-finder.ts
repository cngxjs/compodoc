import { ts } from 'ts-morph';
import ImportsUtil from '../../../utils/imports.util';
import { logger } from '../../../utils/logger';

export class ExpressionFinder {
    public findExpressionByNameInExpressions(entryNode, name) {
        let result;
        const loop = (node, z) => {
            if (node) {
                if (node.expression && !node.expression.name) {
                    loop(node.expression, z);
                }
                if (node.expression?.name) {
                    if (node.expression.name.text === z) {
                        result = node;
                    } else {
                        loop(node.expression, z);
                    }
                }
            }
        };
        loop(entryNode, name);
        return result;
    }

    public findExpressionByNameInExpressionArguments(arg, name) {
        let result;

        let i = 0;
        const len = arg.length;
        const loop = (node, z) => {
            if (node.body) {
                if (node.body.statements && node.body.statements.length > 0) {
                    let j = 0;
                    const leng = node.body.statements.length;
                    for (j; j < leng; j++) {
                        result = this.findExpressionByNameInExpressions(node.body.statements[j], z);
                    }
                }
            }
        };
        for (i; i < len; i++) {
            loop(arg[i], name);
        }
        return result;
    }

    public getSymboleName(node): string {
        return node.name.text;
    }

    public findProperties(
        visitedNode: ts.Decorator,
        sourceFile: ts.SourceFile
    ): ReadonlyArray<ts.ObjectLiteralElementLike> {
        if (
            visitedNode.expression &&
            (visitedNode.expression as any).arguments &&
            (visitedNode.expression as any).arguments.length > 0
        ) {
            const pop = (visitedNode.expression as any).arguments[0];

            if (pop?.properties && pop.properties.length >= 0) {
                return pop.properties;
            } else if (pop?.kind && pop.kind === ts.SyntaxKind.StringLiteral) {
                return [pop];
            } else {
                logger.warn('Empty metadatas, trying to find it with imports.');
                return ImportsUtil.findValueInImportOrLocalVariables(pop.text, sourceFile) as any;
            }
        }

        return [];
    }
}
