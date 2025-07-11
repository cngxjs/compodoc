import * as ts from 'typescript';
const tsany = ts as any;

// https://github.com/Microsoft/TypeScript/blob/v2.1.4/src/compiler/utilities.ts#L152
export function getSourceFileOfNode(...args: any[]): ts.SourceFile {
    return tsany.getSourceFileOfNode.apply(this, args);
}

// https://github.com/Microsoft/TypeScript/blob/v2.1.4/src/compiler/utilities.ts#L1423
export function getJSDocCommentRanges(...args: any[]) {
    return tsany.getJSDocCommentRanges.apply(this, args);
}
