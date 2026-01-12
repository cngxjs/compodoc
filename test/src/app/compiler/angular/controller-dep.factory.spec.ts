import { expect } from 'chai';
import { Project, ts } from 'ts-morph';
import * as sinon from 'sinon';
import { ControllerDepFactory, IControllerDep } from '../../../../../src/app/compiler/angular/deps/controller-dep.factory';

describe('ControllerDepFactory', () => {
    let controllerDepFactory: ControllerDepFactory;
    let project: Project;

    beforeEach(() => {
        controllerDepFactory = new ControllerDepFactory();
        project = new Project();

        // Mock crypto.createHash globally
        const mockHash = {
            update: sinon.stub().returnsThis(),
            digest: sinon.stub().returns('mocked-hash')
        };

        sinon.stub(require('crypto'), 'createHash').returns(mockHash);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('constructor', () => {
        it('should create ControllerDepFactory instance', () => {
            const factory = new ControllerDepFactory();
            expect(factory).to.be.instanceOf(ControllerDepFactory);
        });
    });

    describe('create()', () => {
        let mockFile: any;
        let mockSrcFile: ts.SourceFile;
        let mockIO: any;

        beforeEach(() => {
            mockFile = { path: '/test/file.ts' };
            mockSrcFile = project.createSourceFile('test.ts', 'class TestController {}').compilerNode;
            mockIO = {
                methods: ['method1', 'method2'],
                description: 'Test controller description',
                rawdescription: 'Test raw description',
                deprecated: false,
                deprecationMessage: '',
                extends: undefined
            };
        });

        it('should create IControllerDep with correct basic properties', () => {
            const result = controllerDepFactory.create(
                mockFile,
                mockSrcFile,
                'TestController',
                [],
                mockIO
            );

            expect(result).to.be.an('object');
            expect(result.name).to.equal('TestController');
            expect(result.id).to.equal('controller-TestController-mocked-hash');
            expect(result.file).to.equal(mockFile);
            expect(result.methodsClass).to.equal(mockIO.methods);
            expect(result.type).to.equal('controller');
            expect(result.description).to.equal(mockIO.description);
            expect(result.rawdescription).to.equal(mockIO.rawdescription);
            expect(result.sourceCode).to.equal(mockSrcFile.text);
            expect(result.deprecated).to.equal(mockIO.deprecated);
            expect(result.deprecationMessage).to.equal(mockIO.deprecationMessage);
        });

        it('should generate SHA-512 hash from source code', () => {
            const sourceCode = 'class TestController {}';

            controllerDepFactory.create(mockFile, mockSrcFile, 'TestController', [], mockIO);

            const cryptoStub = require('crypto').createHash as sinon.SinonStub;
            expect(cryptoStub.calledWith('sha512')).to.be.true;
        });

        it('should set prefix when properties has exactly one element with text property', () => {
            const properties = [
                { text: 'api' } as any
            ];

            const result = controllerDepFactory.create(
                mockFile,
                mockSrcFile,
                'TestController',
                properties,
                mockIO
            );

            expect(result.prefix).to.equal('api');
        });

        it('should not set prefix when properties is empty', () => {
            const properties: ReadonlyArray<ts.ObjectLiteralElementLike> = [];

            const result = controllerDepFactory.create(
                mockFile,
                mockSrcFile,
                'TestController',
                properties,
                mockIO
            );

            expect(result.prefix).to.be.undefined;
        });

        it('should not set prefix when properties has multiple elements', () => {
            const properties = [
                { text: 'api' } as any,
                { text: 'v1' } as any
            ];

            const result = controllerDepFactory.create(
                mockFile,
                mockSrcFile,
                'TestController',
                properties,
                mockIO
            );

            expect(result.prefix).to.be.undefined;
        });

        it('should not set prefix when property has no text', () => {
            const properties = [
                { noText: 'value' } as any
            ];

            const result = controllerDepFactory.create(
                mockFile,
                mockSrcFile,
                'TestController',
                properties,
                mockIO
            );

            expect(result.prefix).to.be.undefined;
        });

        it('should set extends when IO.extends exists', () => {
            const extendedIO = { ...mockIO, extends: 'BaseController' };

            const result = controllerDepFactory.create(
                mockFile,
                mockSrcFile,
                'TestController',
                [],
                extendedIO
            );

            expect(result.extends).to.equal('BaseController');
        });

        it('should not set extends when IO.extends does not exist', () => {
            const result = controllerDepFactory.create(
                mockFile,
                mockSrcFile,
                'TestController',
                [],
                mockIO
            );

            expect(result.extends).to.be.undefined;
        });

        it('should handle deprecated controller with deprecation message', () => {
            const deprecatedIO = {
                ...mockIO,
                deprecated: true,
                deprecationMessage: 'This controller is deprecated'
            };

            const result = controllerDepFactory.create(
                mockFile,
                mockSrcFile,
                'TestController',
                [],
                deprecatedIO
            );

            expect(result.deprecated).to.be.true;
            expect(result.deprecationMessage).to.equal('This controller is deprecated');
        });

        it('should handle empty methods array', () => {
            const emptyMethodsIO = { ...mockIO, methods: [] };

            const result = controllerDepFactory.create(
                mockFile,
                mockSrcFile,
                'TestController',
                [],
                emptyMethodsIO
            );

            expect(result.methodsClass).to.be.an('array').that.is.empty;
        });

        it('should handle complex source code with hash generation', () => {
            const complexSourceFile = project.createSourceFile('complex.ts',
                `import { Controller } from '@nestjs/common';

@Controller('users')
export class UserController {
    constructor(private userService: UserService) {}

    @Get()
    findAll(): Promise<User[]> {
        return this.userService.findAll();
    }

    @Post()
    create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.userService.create(createUserDto);
    }
}`
            ).compilerNode;

            controllerDepFactory.create(
                mockFile,
                complexSourceFile,
                'UserController',
                [],
                mockIO
            );

            const cryptoStub = require('crypto').createHash as sinon.SinonStub;
            expect(cryptoStub().update.calledWith(complexSourceFile.getText())).to.be.true;
        });
    });

    describe('IControllerDep interface', () => {
        it('should conform to IControllerDep interface structure', () => {
            const mockFile = { path: '/test/file.ts' };
            const mockSrcFile = project.createSourceFile('test.ts', 'class TestController {}').compilerNode;
            const mockIO = {
                methods: ['method1', 'method2'],
                description: 'Test controller description',
                rawdescription: 'Test raw description',
                deprecated: false,
                deprecationMessage: '',
                extends: undefined
            };

            const result = controllerDepFactory.create(
                mockFile,
                mockSrcFile,
                'TestController',
                [],
                mockIO
            );

            // Check that all required properties are present
            const requiredProps: (keyof IControllerDep)[] = [
                'name', 'id', 'file', 'methodsClass', 'type',
                'description', 'rawdescription', 'sourceCode',
                'deprecated', 'deprecationMessage'
            ];

            requiredProps.forEach(prop => {
                expect(result).to.have.property(prop);
            });

            // Check optional properties (may or may not be present)
            if ('prefix' in result) {
                expect(result.prefix).to.be.a('string');
            }
            if ('extends' in result) {
                expect(result.extends).to.be.a('string');
            }
        });
    });
});
