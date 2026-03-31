import { ts } from 'ts-morph';

export function isModuleWithProviders(node: ts.VariableStatement): boolean {
    let result = false;
    if (node.declarationList) {
        if (node.declarationList.declarations && node.declarationList.declarations.length > 0) {
            let i = 0,
                declarations = node.declarationList.declarations,
                len = node.declarationList.declarations.length;

            for (i; i < len; i++) {
                const declaration = node.declarationList.declarations[i];

                if (declaration.type) {
                    const type: ts.TypeReferenceNode = declaration.type as ts.TypeReferenceNode;
                    if (type.typeName) {
                        const text = type.typeName.getText();
                        if (text === 'ModuleWithProviders') {
                            result = true;
                        }
                    }
                }
            }
        }
    }
    return result;
}
