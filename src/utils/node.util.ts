import { ts } from 'ts-morph';

export function nodeHasDecorator(node: ts.Node) {
    // In TypeScript 5.x, decorators are accessed via ts.getDecorators(), not ts.getModifiers()
    const decorators = ts.getDecorators(node as ts.HasDecorators);
    return decorators !== undefined && decorators.length > 0;
}

export function getNodeDecorators(node: ts.Node): ts.Decorator[] {
    // In TypeScript 5.x, decorators are accessed via ts.getDecorators(), not ts.getModifiers()
    const decorators = ts.getDecorators(node as ts.HasDecorators);
    return decorators ? [...decorators] : [];
}
