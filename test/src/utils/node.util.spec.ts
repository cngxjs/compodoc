
import { Project, SyntaxKind } from 'ts-morph';
import { nodeHasDecorator, getNodeDecorators } from '../../../src/utils/node.util';

describe('Utils - NodeUtil', () => {
    let project: Project;

    beforeEach(() => {
        project = new Project();
    });

    describe('nodeHasDecorator()', () => {
        it('should return true for a class with decorators', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                @Component({})
                class TestClass {}
            `);
            const classDeclaration = sourceFile.getClass('TestClass');

            const result = nodeHasDecorator(classDeclaration!.compilerNode);

            expect(result).to.be.true;
        });

        it('should return true for a method with decorators', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                class TestClass {
                    @HostListener('click')
                    onClick() {}
                }
            `);
            const method = sourceFile.getClass('TestClass')!.getMethod('onClick');

            const result = nodeHasDecorator(method!.compilerNode);

            expect(result).to.be.true;
        });

        it('should return true for a property with decorators', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                class TestClass {
                    @Input()
                    prop: string;
                }
            `);
            const property = sourceFile.getClass('TestClass')!.getProperty('prop');

            const result = nodeHasDecorator(property!.compilerNode);

            expect(result).to.be.true;
        });

        it('should return false for a class without decorators', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                class TestClass {}
            `);
            const classDeclaration = sourceFile.getClass('TestClass');

            const result = nodeHasDecorator(classDeclaration!.compilerNode);

            expect(result).to.be.false;
        });

        it('should return false for a method without decorators', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                class TestClass {
                    onClick() {}
                }
            `);
            const method = sourceFile.getClass('TestClass')!.getMethod('onClick');

            const result = nodeHasDecorator(method!.compilerNode);

            expect(result).to.be.false;
        });

        it('should return false for a property without decorators', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                class TestClass {
                    prop: string;
                }
            `);
            const property = sourceFile.getClass('TestClass')!.getProperty('prop');

            const result = nodeHasDecorator(property!.compilerNode);

            expect(result).to.be.false;
        });

        it('should return false for a function declaration', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                function testFunction() {}
            `);
            const functionDeclaration = sourceFile.getFunction('testFunction');

            const result = nodeHasDecorator(functionDeclaration!.compilerNode);

            expect(result).to.be.false;
        });

        it('should return false for a variable declaration', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                const x = 1;
            `);
            const variableDeclaration = sourceFile.getVariableDeclaration('x');

            const result = nodeHasDecorator(variableDeclaration!.compilerNode);

            expect(result).to.be.false;
        });
    });

    describe('getNodeDecorators()', () => {
        it('should return decorators for a class with single decorator', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                @Component({})
                class TestClass {}
            `);
            const classDeclaration = sourceFile.getClass('TestClass');

            const result = getNodeDecorators(classDeclaration!.compilerNode);

            expect(result).to.have.lengthOf(1);
            expect(result[0].kind).to.equal(SyntaxKind.Decorator);
        });

        it('should return decorators for a class with multiple decorators', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                @Component({})
                @Injectable()
                class TestClass {}
            `);
            const classDeclaration = sourceFile.getClass('TestClass');

            const result = getNodeDecorators(classDeclaration!.compilerNode);

            expect(result).to.have.lengthOf(2);
            expect(result[0].kind).to.equal(SyntaxKind.Decorator);
            expect(result[1].kind).to.equal(SyntaxKind.Decorator);
        });

        it('should return decorators for a method with decorator', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                class TestClass {
                    @HostListener('click')
                    onClick() {}
                }
            `);
            const method = sourceFile.getClass('TestClass')!.getMethod('onClick');

            const result = getNodeDecorators(method!.compilerNode);

            expect(result).to.have.lengthOf(1);
            expect(result[0].kind).to.equal(SyntaxKind.Decorator);
        });

        it('should return decorators for a property with decorator', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                class TestClass {
                    @Input()
                    prop: string;
                }
            `);
            const property = sourceFile.getClass('TestClass')!.getProperty('prop');

            const result = getNodeDecorators(property!.compilerNode);

            expect(result).to.have.lengthOf(1);
            expect(result[0].kind).to.equal(SyntaxKind.Decorator);
        });

        it('should return empty array for a class without decorators', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                class TestClass {}
            `);
            const classDeclaration = sourceFile.getClass('TestClass');

            const result = getNodeDecorators(classDeclaration!.compilerNode);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should return empty array for a method without decorators', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                class TestClass {
                    onClick() {}
                }
            `);
            const method = sourceFile.getClass('TestClass')!.getMethod('onClick');

            const result = getNodeDecorators(method!.compilerNode);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should return empty array for a property without decorators', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                class TestClass {
                    prop: string;
                }
            `);
            const property = sourceFile.getClass('TestClass')!.getProperty('prop');

            const result = getNodeDecorators(property!.compilerNode);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should return empty array for a function declaration', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                function testFunction() {}
            `);
            const functionDeclaration = sourceFile.getFunction('testFunction');

            const result = getNodeDecorators(functionDeclaration!.compilerNode);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should return empty array for a variable declaration', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                const x = 1;
            `);
            const variableDeclaration = sourceFile.getVariableDeclaration('x');

            const result = getNodeDecorators(variableDeclaration!.compilerNode);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should return a copy of the decorators array, not the original', () => {
            const sourceFile = project.createSourceFile('test.ts', `
                @Component({})
                class TestClass {}
            `);
            const classDeclaration = sourceFile.getClass('TestClass');

            const result1 = getNodeDecorators(classDeclaration!.compilerNode);
            const result2 = getNodeDecorators(classDeclaration!.compilerNode);

            expect(result1).to.not.equal(result2); // Different array references
            expect(result1).to.deep.equal(result2); // But same content
        });
    });
});
