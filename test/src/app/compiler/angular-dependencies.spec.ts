import { expect } from 'chai';
import { ts, Project, SourceFile, Node, SyntaxKind } from 'ts-morph';

describe('Object Destructuring Support', () => {
    let project: Project;
    let sourceFile: SourceFile;

    const sourceFileName = 'ObjectDestructuring.test.ts';

    beforeEach(() => {
        project = new Project();
    });

    afterEach(() => {
        if (sourceFile) {
            sourceFile.delete();
        }
    });

    describe('ObjectBindingPattern detection', () => {
        it('should detect simple object destructuring patterns', () => {
            const sourceCode = `
                function getQuestionAndAnswer() {
                    return { question: "What is TypeScript?", answer: 42 };
                }
                export const { question } = getQuestionAndAnswer();
                export const { answer } = getQuestionAndAnswer();
            `;

            sourceFile = project.createSourceFile(sourceFileName, sourceCode);
            
            // Find all variable declarations with object binding patterns
            const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
            const objectBindingDeclarations = variableDeclarations.filter(decl => {
                return decl.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern;
            });

            expect(objectBindingDeclarations).to.have.length(2);
            
            // Check first destructuring: { question }
            const firstBinding = objectBindingDeclarations[0];
            const firstBindingPattern = firstBinding.getNameNode();
            expect(firstBindingPattern.getKind()).to.equal(SyntaxKind.ObjectBindingPattern);
            
            const firstElements = firstBindingPattern.asKindOrThrow(SyntaxKind.ObjectBindingPattern).getElements();
            expect(firstElements).to.have.length(1);
            expect(firstElements[0].getName()).to.equal('question');

            // Check second destructuring: { answer }
            const secondBinding = objectBindingDeclarations[1];
            const secondBindingPattern = secondBinding.getNameNode();
            expect(secondBindingPattern.getKind()).to.equal(SyntaxKind.ObjectBindingPattern);
            
            const secondElements = secondBindingPattern.asKindOrThrow(SyntaxKind.ObjectBindingPattern).getElements();
            expect(secondElements).to.have.length(1);
            expect(secondElements[0].getName()).to.equal('answer');
        });

        it('should detect multiple properties in single destructuring', () => {
            const sourceCode = `
                function getUserData() {
                    return { name: "John", age: 30, email: "john@example.com" };
                }
                export const { name, age, email } = getUserData();
            `;

            sourceFile = project.createSourceFile(sourceFileName, sourceCode);
            
            const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
            const objectBindingDeclarations = variableDeclarations.filter(decl => {
                return decl.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern;
            });

            expect(objectBindingDeclarations).to.have.length(1);
            
            const bindingPattern = objectBindingDeclarations[0].getNameNode();
            const elements = bindingPattern.asKindOrThrow(SyntaxKind.ObjectBindingPattern).getElements();
            
            expect(elements).to.have.length(3);
            expect(elements[0].getName()).to.equal('name');
            expect(elements[1].getName()).to.equal('age');
            expect(elements[2].getName()).to.equal('email');
        });

        it('should detect object destructuring with renamed variables', () => {
            const sourceCode = `
                function getConfig() {
                    return { apiUrl: "https://api.example.com", timeout: 5000 };
                }
                export const { apiUrl: serverUrl, timeout: requestTimeout } = getConfig();
            `;

            sourceFile = project.createSourceFile(sourceFileName, sourceCode);
            
            const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
            const objectBindingDeclarations = variableDeclarations.filter(decl => {
                return decl.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern;
            });

            expect(objectBindingDeclarations).to.have.length(1);
            
            const bindingPattern = objectBindingDeclarations[0].getNameNode();
            const elements = bindingPattern.asKindOrThrow(SyntaxKind.ObjectBindingPattern).getElements();
            
            expect(elements).to.have.length(2);
            
            // Check first element: apiUrl: serverUrl
            const firstElement = elements[0];
            expect(firstElement.getPropertyNameNode()?.getText()).to.equal('apiUrl');
            expect(firstElement.getName()).to.equal('serverUrl');
            
            // Check second element: timeout: requestTimeout
            const secondElement = elements[1];
            expect(secondElement.getPropertyNameNode()?.getText()).to.equal('timeout');
            expect(secondElement.getName()).to.equal('requestTimeout');
        });

        it('should detect object destructuring with default values', () => {
            const sourceCode = `
                function getSettings() {
                    return { theme: "dark" };
                }
                export const { theme = "light", language = "en" } = getSettings();
            `;

            sourceFile = project.createSourceFile(sourceFileName, sourceCode);
            
            const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
            const objectBindingDeclarations = variableDeclarations.filter(decl => {
                return decl.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern;
            });

            expect(objectBindingDeclarations).to.have.length(1);
            
            const bindingPattern = objectBindingDeclarations[0].getNameNode();
            const elements = bindingPattern.asKindOrThrow(SyntaxKind.ObjectBindingPattern).getElements();
            
            expect(elements).to.have.length(2);
            
            // Check that elements have initializers (default values)
            const firstElement = elements[0];
            expect(firstElement.getName()).to.equal('theme');
            expect(firstElement.getInitializer()?.getText()).to.equal('"light"');
            
            const secondElement = elements[1];
            expect(secondElement.getName()).to.equal('language');
            expect(secondElement.getInitializer()?.getText()).to.equal('"en"');
        });

        it('should detect nested object destructuring', () => {
            const sourceCode = `
                function getUserProfile() {
                    return { 
                        user: { 
                            name: "John", 
                            settings: { theme: "dark", lang: "en" } 
                        } 
                    };
                }
                export const { user: { name, settings: { theme } } } = getUserProfile();
            `;

            sourceFile = project.createSourceFile(sourceFileName, sourceCode);
            
            const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
            const objectBindingDeclarations = variableDeclarations.filter(decl => {
                return decl.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern;
            });

            expect(objectBindingDeclarations).to.have.length(1);
            
            // The nested structure should be present - we're testing that ts-morph can parse it
            const bindingPattern = objectBindingDeclarations[0].getNameNode();
            const elements = bindingPattern.asKindOrThrow(SyntaxKind.ObjectBindingPattern).getElements();
            
            expect(elements).to.have.length(1);
            expect(elements[0].getPropertyNameNode()?.getText()).to.equal('user');
            
            // The binding element should have a nested ObjectBindingPattern
            const nestedBinding = elements[0].getNameNode();
            expect(nestedBinding.getKind()).to.equal(SyntaxKind.ObjectBindingPattern);
        });

        it('should detect object destructuring with rest elements', () => {
            const sourceCode = `
                function getDataWithRest() {
                    return { a: 1, b: 2, c: 3, d: 4 };
                }
                export const { a, b, ...rest } = getDataWithRest();
            `;

            sourceFile = project.createSourceFile(sourceFileName, sourceCode);
            
            const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
            const objectBindingDeclarations = variableDeclarations.filter(decl => {
                return decl.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern;
            });

            expect(objectBindingDeclarations).to.have.length(1);
            
            const bindingPattern = objectBindingDeclarations[0].getNameNode();
            const elements = bindingPattern.asKindOrThrow(SyntaxKind.ObjectBindingPattern).getElements();
            
            expect(elements).to.have.length(3);
            expect(elements[0].getName()).to.equal('a');
            expect(elements[1].getName()).to.equal('b');
            expect(elements[2].getName()).to.equal('rest');
            expect(elements[2].getDotDotDotToken()).to.exist; // Rest element
        });
    });

    describe('Type inference for object destructuring', () => {
        it('should identify function call expressions as initializers', () => {
            const sourceCode = `
                function getQuestionAndAnswer() {
                    return { question: "What is TypeScript?", answer: 42 };
                }
                export const { question } = getQuestionAndAnswer();
            `;

            sourceFile = project.createSourceFile(sourceFileName, sourceCode);
            
            const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
            const objectBindingDeclarations = variableDeclarations.filter(decl => {
                return decl.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern;
            });

            expect(objectBindingDeclarations).to.have.length(1);
            
            const initializer = objectBindingDeclarations[0].getInitializer();
            expect(initializer).to.exist;
            expect(initializer?.getKind()).to.equal(SyntaxKind.CallExpression);
            expect(initializer?.getText()).to.equal('getQuestionAndAnswer()');
        });

        it('should find function declarations for type inference', () => {
            const sourceCode = `
                /**
                 * Returns question and answer data
                 */
                function getQuestionAndAnswer(): { question: string; answer: number } {
                    return { question: "What is TypeScript?", answer: 42 };
                }
                export const { question } = getQuestionAndAnswer();
            `;

            sourceFile = project.createSourceFile(sourceFileName, sourceCode);
            
            // Find the function declaration
            const functionDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
            expect(functionDeclarations).to.have.length(1);
            
            const func = functionDeclarations[0];
            expect(func.getName()).to.equal('getQuestionAndAnswer');
            
            // Check return type
            const returnType = func.getReturnTypeNode();
            expect(returnType).to.exist;
            expect(returnType?.getKind()).to.equal(SyntaxKind.TypeLiteral);
            
            // Check that we can extract type members
            const typeLiteral = returnType?.asKindOrThrow(SyntaxKind.TypeLiteral);
            const members = typeLiteral?.getMembers();
            expect(members).to.have.length(2);
        });

        it('should identify property signatures in type literals', () => {
            const sourceCode = `
                function getData(): { name: string; age: number; active: boolean } {
                    return { name: "John", age: 30, active: true };
                }
                export const { name, age } = getData();
            `;

            sourceFile = project.createSourceFile(sourceFileName, sourceCode);
            
            const functionDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
            const func = functionDeclarations[0];
            const returnType = func.getReturnTypeNode()?.asKindOrThrow(SyntaxKind.TypeLiteral);
            const members = returnType?.getMembers();
            
            expect(members).to.have.length(3);
            
            // Check property signatures
            const nameProperty = members?.[0].asKindOrThrow(SyntaxKind.PropertySignature);
            expect(nameProperty?.getName()).to.equal('name');
            expect(nameProperty?.getTypeNode()?.getText()).to.equal('string');
            
            const ageProperty = members?.[1].asKindOrThrow(SyntaxKind.PropertySignature);
            expect(ageProperty?.getName()).to.equal('age');
            expect(ageProperty?.getTypeNode()?.getText()).to.equal('number');
        });
    });

    describe('Array destructuring alongside object destructuring', () => {
        it('should differentiate between array and object binding patterns', () => {
            const sourceCode = `
                function getArrayData() {
                    return ["first", "second", "third"];
                }
                
                function getObjectData() {
                    return { x: 10, y: 20 };
                }
                
                export const [first, second] = getArrayData();
                export const { x, y } = getObjectData();
            `;

            sourceFile = project.createSourceFile(sourceFileName, sourceCode);
            
            const variableDeclarations = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
            
            const arrayBindingDeclarations = variableDeclarations.filter(decl => {
                return decl.getNameNode().getKind() === SyntaxKind.ArrayBindingPattern;
            });
            
            const objectBindingDeclarations = variableDeclarations.filter(decl => {
                return decl.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern;
            });

            expect(arrayBindingDeclarations).to.have.length(1);
            expect(objectBindingDeclarations).to.have.length(1);
            
            // Check array destructuring
            const arrayElements = arrayBindingDeclarations[0].getNameNode()
                .asKindOrThrow(SyntaxKind.ArrayBindingPattern).getElements();
            expect(arrayElements).to.have.length(2);
            expect((arrayElements[0] as any).getName()).to.equal('first');
            expect((arrayElements[1] as any).getName()).to.equal('second');
            
            // Check object destructuring  
            const objectElements = objectBindingDeclarations[0].getNameNode()
                .asKindOrThrow(SyntaxKind.ObjectBindingPattern).getElements();
            expect(objectElements).to.have.length(2);
            expect(objectElements[0].getName()).to.equal('x');
            expect(objectElements[1].getName()).to.equal('y');
        });
    });
});
