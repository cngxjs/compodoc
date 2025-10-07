import {expect} from 'chai';
import {ts, Project, SourceFile} from 'ts-morph';

import {SymbolHelper} from '../../../../../../../src/app/compiler/angular/deps/helpers/symbol-helper';

describe(SymbolHelper.name, () => {
    let helper: SymbolHelper;

    const sourceFileName = 'SymbolHelper.test.ts';
    let sourceFile: SourceFile;

    const project = new Project();

    beforeEach(() => {
        helper = new SymbolHelper();
    });

    afterEach(() => {
        sourceFile.delete();
    })

    describe('parseProviderConfiguration', () => {
        it('should return identifier for basic provider config', () => {
            sourceFile = project.createSourceFile(sourceFileName, `const provider = TestProvider;`);

            const providerConfig = sourceFile.getVariableDeclaration("provider")!.getInitializer()!.compilerNode as ts.ObjectLiteralExpression;
            const result = helper.parseProviderConfiguration(providerConfig);

            expect(result).to.equal('TestProvider');
        });

        it('should return identifier for "useClass" provider config', () => {
            sourceFile = project.createSourceFile(sourceFileName, `const provider = {provide: 'test', useClass: TestProvider};`);

            const providerConfig = sourceFile.getVariableDeclaration("provider")!.getInitializer()!.compilerNode as ts.ObjectLiteralExpression;
            const result = helper.parseProviderConfiguration(providerConfig);

            expect(result).to.equal('TestProvider');
        });

        it('should return identifier for "useValue" provider config', () => {
            sourceFile = project.createSourceFile(sourceFileName, `const provider = {provide: 'test', useValue: TestProvider};`);

            const providerConfig = sourceFile.getVariableDeclaration("provider")!.getInitializer()!.compilerNode as ts.ObjectLiteralExpression;
            const result = helper.parseProviderConfiguration(providerConfig);

            expect(result).to.equal('TestProvider');
        });

        it('should return identifier for "useFactory" provider config', () => {
            sourceFile = project.createSourceFile(sourceFileName, `const provider = {provide: 'test', useFactory: () => TestProvider};`);

            const providerConfig = sourceFile.getVariableDeclaration("provider")!.getInitializer()!.compilerNode as ts.ObjectLiteralExpression;
            const result = helper.parseProviderConfiguration(providerConfig);

            expect(result).to.equal('TestProvider');
        });

        it('should return identifier for "useExisting" provider config', () => {
            sourceFile = project.createSourceFile(sourceFileName, `const provider = {provide: 'test', useExisting: TestProvider};`);

            const providerConfig = sourceFile.getVariableDeclaration("provider")!.getInitializer()!.compilerNode as ts.ObjectLiteralExpression;
            const result = helper.parseProviderConfiguration(providerConfig);

            expect(result).to.equal('TestProvider');
        });
    });

    describe('buildIdentifierName', () => {
        it('should handle RouterModule.forRoot', () => {
            sourceFile = project.createSourceFile(sourceFileName, `const router = RouterModule.forRoot;`);

            const variableDeclaration = sourceFile.getVariableDeclaration("router")!;
            const propertyAccess = variableDeclaration.getInitializer()!.compilerNode as ts.PropertyAccessExpression;
            const result = helper.buildIdentifierName(propertyAccess, '');

            expect(result).to.equal('RouterModule.forRoot');
        });
    });

    describe('parseSymbolElements', () => {
        it('should handle CallExpression and remove args', () => {
            sourceFile = project.createSourceFile(sourceFileName, `const router = RouterModule.forRoot('arg1');`);

            const variableDeclaration = sourceFile.getVariableDeclaration("router")!;
            const callExp = variableDeclaration.getInitializer()!.compilerNode as ts.CallExpression;
            const result = helper.parseSymbolElements(callExp);

            expect(result).to.equal('RouterModule.forRoot(args)');
        });

        it('should handle sub-Module', () => {
            sourceFile = project.createSourceFile(sourceFileName, `const sharedModule = Shared.Module;`);

            const variableDeclaration = sourceFile.getVariableDeclaration("sharedModule")!;
            const propertyAccess = variableDeclaration.getInitializer()!.compilerNode as ts.PropertyAccessExpression;
            const result = helper.parseSymbolElements(propertyAccess);

            expect(result).to.equal('Shared.Module');
        });

        it('should handle string literal', () => {
            sourceFile = project.createSourceFile(sourceFileName, `const cssPath = "./app.component.css";`);

            const variableDeclaration = sourceFile.getVariableDeclaration("cssPath")!;
            const stringLiteral = variableDeclaration.getInitializer()!.compilerNode as ts.StringLiteral;
            const result = helper.parseSymbolElements(stringLiteral);

            expect(result).to.equal('./app.component.css');
        });
    });
});
