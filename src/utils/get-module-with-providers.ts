import { ts } from 'ts-morph';

export function getModuleWithProviders(node: ts.VariableStatement) {
    let result;
    if (node.declarationList) {
        if (node.declarationList.declarations && node.declarationList.declarations.length > 0) {
            let i = 0;
            const len = node.declarationList.declarations.length;

            for (i; i < len; i++) {
                const declaration = node.declarationList.declarations[i];

                if (declaration.type) {
                    const type: ts.TypeReferenceNode = declaration.type as ts.TypeReferenceNode;
                    if (type.typeName) {
                        const text = type.typeName.getText();
                        if (text === 'ModuleWithProviders') {
                            result = declaration.initializer;
                        }
                    }
                }
            }
        }
    }
    return result;
}
