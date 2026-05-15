import * as path from 'node:path';
import { Node, Project, type SourceFile, SyntaxKind, ts } from 'ts-morph';
import ImportsUtil from '../imports.util';
import type { RouteStore } from './route-store';

export class SourceFileCleaner {
    private readonly ast = new Project();

    constructor(private readonly routeStore: RouteStore) {}

    public cleanFileIdentifiers(sourceFile: SourceFile): SourceFile {
        const file = sourceFile;
        const identifiers = file.getDescendantsOfKind(SyntaxKind.Identifier).filter(p => {
            return (
                Node.isArrayLiteralExpression(p.getParentOrThrow()) ||
                Node.isPropertyAssignment(p.getParentOrThrow())
            );
        });

        const identifiersInRoutesVariableStatement = [];

        for (const identifier of identifiers) {
            // Loop through their parents nodes, and if one is a variableStatement and === 'routes'
            let foundParentVariableStatement = false;
            identifier.getParentWhile(n => {
                if (n.getKind() === SyntaxKind.VariableStatement) {
                    if (this.routeStore.isVariableRoutes(n.compilerNode)) {
                        foundParentVariableStatement = true;
                    }
                }
                return true;
            });
            if (foundParentVariableStatement) {
                identifiersInRoutesVariableStatement.push(identifier);
            }
        }

        // inline the property access expressions
        for (const identifier of identifiersInRoutesVariableStatement) {
            const identifierDeclaration = identifier
                .getSymbolOrThrow()
                .getValueDeclarationOrThrow();
            if (
                !Node.isPropertyAssignment(identifierDeclaration) &&
                !Node.isVariableDeclaration(identifierDeclaration)
            ) {
                throw new Error(
                    `Not implemented referenced declaration kind: ${identifierDeclaration.getKindName()}`
                );
            }
            if (Node.isVariableDeclaration(identifierDeclaration)) {
                identifier.replaceWithText(identifierDeclaration.getInitializerOrThrow().getText());
            }
        }

        return file;
    }

    public cleanFileSpreads(sourceFile: SourceFile): SourceFile {
        const file = sourceFile;
        const spreadElements = file
            .getDescendantsOfKind(SyntaxKind.SpreadElement)
            .filter(p => Node.isArrayLiteralExpression(p.getParentOrThrow()));

        const spreadElementsInRoutesVariableStatement = [];

        for (const spreadElement of spreadElements) {
            // Loop through their parents nodes, and if one is a variableStatement and === 'routes'
            let foundParentVariableStatement = false;
            spreadElement.getParentWhile(n => {
                if (n.getKind() === SyntaxKind.VariableStatement) {
                    if (this.routeStore.isVariableRoutes(n.compilerNode)) {
                        foundParentVariableStatement = true;
                    }
                }
                return true;
            });
            if (foundParentVariableStatement) {
                spreadElementsInRoutesVariableStatement.push(spreadElement);
            }
        }

        // inline the ArrayLiteralExpression SpreadElements
        for (const spreadElement of spreadElementsInRoutesVariableStatement) {
            let spreadElementIdentifier = spreadElement.getExpression().getText(),
                searchedImport,
                aliasOriginalName = '',
                foundWithAliasInImports = false,
                foundWithAlias = false;

            // Try to find it in imports
            const imports = file.getImportDeclarations();

            imports.forEach(i => {
                let namedImports = i.getNamedImports(),
                    namedImportsLength = namedImports.length,
                    j = 0;

                if (namedImportsLength > 0) {
                    for (j; j < namedImportsLength; j++) {
                        let importName = namedImports[j].getNameNode().getText() as string,
                            importAlias;

                        if (namedImports[j].getAliasNode()) {
                            importAlias = namedImports[j].getAliasNode().getText();
                        }

                        if (importName === spreadElementIdentifier) {
                            foundWithAliasInImports = true;
                            searchedImport = i;
                            break;
                        }
                        if (importAlias === spreadElementIdentifier) {
                            foundWithAliasInImports = true;
                            foundWithAlias = true;
                            aliasOriginalName = importName;
                            searchedImport = i;
                            break;
                        }
                    }
                }
            });

            let referencedDeclaration;

            if (foundWithAliasInImports) {
                if (typeof searchedImport !== 'undefined') {
                    const routePathIsBad = p => {
                        const result = this.routeStore.scannedFiles.find(
                            scannedFile => p === scannedFile.path
                        );
                        return !result;
                    };

                    const getIndicesOf = (searchStr, str, caseSensitive) => {
                        const searchStrLen = searchStr.length;
                        if (searchStrLen === 0) {
                            return [];
                        }
                        let startIndex = 0,
                            index,
                            indices = [];
                        if (!caseSensitive) {
                            str = str.toLowerCase();
                            searchStr = searchStr.toLowerCase();
                        }
                        while ((index = str.indexOf(searchStr, startIndex)) > -1) {
                            indices.push(index);
                            startIndex = index + searchStrLen;
                        }
                        return indices;
                    };

                    const dirNamePath = path.dirname(file.getFilePath());
                    const searchedImportPath = searchedImport.getModuleSpecifierValue();
                    const leadingFilePath = searchedImportPath.split('/').shift();

                    let importPath = path.resolve(
                        `${dirNamePath}/${searchedImport.getModuleSpecifierValue()}.ts`
                    );

                    if (routePathIsBad(importPath)) {
                        const leadingIndices = getIndicesOf(leadingFilePath, importPath, true);
                        if (leadingIndices.length > 1) {
                            // Nested route fixes
                            const startIndex = leadingIndices[0];
                            const endIndex = leadingIndices[leadingIndices.length - 1];
                            importPath =
                                importPath.slice(0, startIndex) + importPath.slice(endIndex);
                        } else {
                            // Top level route fixes
                            importPath = `${path.dirname(dirNamePath)}/${searchedImportPath}.ts`;
                        }
                    }
                    const sourceFileImport =
                        typeof this.ast.getSourceFile(importPath) !== 'undefined'
                            ? this.ast.getSourceFile(importPath)
                            : this.ast.addSourceFileAtPath(importPath);
                    if (sourceFileImport) {
                        const variableName = foundWithAlias
                            ? aliasOriginalName
                            : spreadElementIdentifier;
                        referencedDeclaration =
                            sourceFileImport.getVariableDeclaration(variableName);
                    }
                }
            } else {
                // if not, try directly in file
                referencedDeclaration = spreadElement
                    .getExpression()
                    .getSymbolOrThrow()
                    .getValueDeclarationOrThrow();
            }

            if (!Node.isVariableDeclaration(referencedDeclaration)) {
                throw new Error(
                    `Not implemented referenced declaration kind: ${referencedDeclaration.getKindName()}`
                );
            }

            const referencedArray = referencedDeclaration.getInitializerIfKindOrThrow(
                SyntaxKind.ArrayLiteralExpression
            );
            const spreadElementArray = spreadElement.getParentIfKindOrThrow(
                SyntaxKind.ArrayLiteralExpression
            );
            const insertIndex = spreadElementArray.getElements().indexOf(spreadElement);
            spreadElementArray.removeElement(spreadElement);
            spreadElementArray.insertElements(
                insertIndex,
                referencedArray.getElements().map(e => e.getText())
            );
        }

        return file;
    }

    public cleanFileDynamics(sourceFile: SourceFile): SourceFile {
        const file = sourceFile;

        const propertyAccessExpressions = file
            .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
            .filter(p => !Node.isPropertyAccessExpression(p.getParentOrThrow()));

        const propertyAccessExpressionsInRoutesVariableStatement = [];

        for (const propertyAccessExpression of propertyAccessExpressions) {
            // Loop through their parents nodes, and if one is a variableStatement and === 'routes'
            let foundParentVariableStatement = false;
            propertyAccessExpression.getParentWhile(n => {
                if (n.getKind() === SyntaxKind.VariableStatement) {
                    if (this.routeStore.isVariableRoutes(n.compilerNode)) {
                        foundParentVariableStatement = true;
                    }
                }
                return true;
            });
            if (foundParentVariableStatement) {
                propertyAccessExpressionsInRoutesVariableStatement.push(propertyAccessExpression);
            }
        }

        // inline the property access expressions
        for (const propertyAccessExpression of propertyAccessExpressionsInRoutesVariableStatement) {
            const propertyAccessExpressionNodeName = propertyAccessExpression.getNameNode();
            if (propertyAccessExpressionNodeName) {
                try {
                    const propertyAccessExpressionNodeNameSymbol =
                        propertyAccessExpressionNodeName.getSymbol();

                    if (propertyAccessExpressionNodeNameSymbol) {
                        const referencedDeclaration =
                            propertyAccessExpressionNodeNameSymbol.getValueDeclarationOrThrow();
                        if (
                            !Node.isPropertyAssignment(referencedDeclaration) &&
                            !Node.isEnumMember(referencedDeclaration)
                        ) {
                            throw new Error(
                                `Not implemented referenced declaration kind: ${referencedDeclaration.getKindName()}`
                            );
                        }
                        if (typeof referencedDeclaration.getInitializerOrThrow !== 'undefined') {
                            propertyAccessExpression.replaceWithText(
                                referencedDeclaration.getInitializerOrThrow().getText()
                            );
                        }
                    }
                    // If symbol is null/undefined, just skip this property access expression
                } catch (_e) {}
            }
        }

        return file;
    }

    /**
     * replace callexpressions with string : utils.doWork() -> 'utils.doWork()' doWork() -> 'doWork()'
     * @param sourceFile ts.SourceFile
     */
    public cleanCallExpressions(sourceFile: SourceFile): SourceFile {
        const file = sourceFile;

        // Find all variable declarations with Routes type
        const variableDeclarations = sourceFile.getVariableDeclarations();
        const routesVariableDeclarations = variableDeclarations.filter(v => {
            const type = v.compilerNode.type;
            if (
                typeof type !== 'undefined' &&
                ts.isTypeReferenceNode(type) &&
                typeof type.typeName !== 'undefined'
            ) {
                return (type.typeName as ts.Identifier).text === 'Routes';
            }
            return false;
        });

        if (routesVariableDeclarations.length === 0) {
            return file;
        }

        // Process all Routes variable declarations
        for (const variableDeclaration of routesVariableDeclarations) {
            const initializer = variableDeclaration.getInitializer();
            if (!initializer) {
                continue;
            }

            for (const callExpr of initializer.getDescendantsOfKind(SyntaxKind.CallExpression)) {
                if (callExpr.wasForgotten()) {
                    continue;
                }
                callExpr.replaceWithText(writer => writer.quote(callExpr.getText()));
            }
        }

        return file;
    }

    /**
     * Clean routes definition with imported data, for example path, children, or dynamic stuff inside data
     *
     * const MY_ROUTES: Routes = [
     *     {
     *         path: 'home',
     *         component: HomeComponent
     *     },
     *     {
     *         path: PATHS.home,
     *         component: HomeComponent
     *     }
     * ];
     *
     * The initializer is an array (ArrayLiteralExpression - 177 ), it has elements, objects (ObjectLiteralExpression - 178)
     * with properties (PropertyAssignment - 261)
     *
     * For each know property (https://angular.io/api/router/Routes#description), we try to see if we have what we want
     *
     * Ex: path and pathMatch want a string, component a component reference.
     *
     * It is an imperative approach, not a generic way, parsing all the tree
     * and find something like this which willl break JSON.stringify : MYIMPORT.path
     *
     * @param  {ts.Node} initializer The node of routes definition
     * @return {ts.Node}             The edited node
     */
    public cleanRoutesDefinitionWithImport(
        initializer: ts.ArrayLiteralExpression,
        _node: ts.Node,
        sourceFile: ts.SourceFile
    ): ts.Node {
        initializer.elements.forEach(element => {
            (element as ts.ObjectLiteralExpression).properties.forEach(_property => {
                const property = _property as ts.PropertyAssignment;
                const propertyName = property.name.getText(),
                    propertyInitializer = property.initializer;
                switch (propertyName) {
                    case 'path':
                    case 'redirectTo':
                    case 'outlet':
                    case 'pathMatch':
                        if (propertyInitializer) {
                            if (propertyInitializer.kind !== SyntaxKind.StringLiteral) {
                                // Identifier(71) won't break parsing, but it will be better to retrive them
                                // PropertyAccessExpression(179) ex: MYIMPORT.path will break it, find it in import
                                if (
                                    propertyInitializer.kind ===
                                        SyntaxKind.PropertyAccessExpression &&
                                    ts.isPropertyAccessExpression(propertyInitializer)
                                ) {
                                    let lastObjectLiteralAttributeName =
                                            propertyInitializer.name.getText(),
                                        firstObjectLiteralAttributeName;
                                    if (propertyInitializer.expression) {
                                        firstObjectLiteralAttributeName =
                                            propertyInitializer.expression.getText();
                                        const result =
                                            ImportsUtil.findPropertyValueInImportOrLocalVariables(
                                                firstObjectLiteralAttributeName +
                                                    '.' +
                                                    lastObjectLiteralAttributeName,
                                                sourceFile
                                            ); // tslint:disable-line
                                        if (result !== '') {
                                            (propertyInitializer as any).kind = 9;
                                            (propertyInitializer as any).text = result;
                                        }
                                    }
                                }
                            }
                        }
                        break;
                }
            });
        });
        return initializer;
    }
}
