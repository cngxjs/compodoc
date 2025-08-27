import { expect } from 'chai';
import * as sinon from 'sinon';
import { Application } from '../../../src/app/application';
import Configuration from '../../../src/app/configuration';
import { logger } from '../../../src/utils/logger';
import FileEngine from '../../../src/app/engines/file.engine';
import HtmlEngine from '../../../src/app/engines/html.engine';
import I18nEngine from '../../../src/app/engines/i18n.engine';
import MarkdownEngine from '../../../src/app/engines/markdown.engine';

describe('Application', () => {
    let application: Application;
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Reset Configuration before each test
        Configuration.mainData = {
            output: './documentation/',
            exportFormat: 'html',
            templates: './src/templates',
            language: 'en-US',
            documentationMainName: 'compodoc',
            documentationMainDescription: '',
            angularVersion: '',
            disableDependencies: false,
            packagePeerDependencies: {},
            readme: false
        } as any;
        
        // Stub logger to prevent console output during tests
        sandbox.stub(logger, 'info');
        sandbox.stub(logger, 'error');
        sandbox.stub(logger, 'warn');
        sandbox.stub(logger, 'debug');
        sandbox.stub(logger, 'silent').value(true);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should initialize with empty options', () => {
            application = new Application();
            expect(application).to.be.instanceOf(Application);
        });

        it('should set configuration options from constructor - line 87-89', () => {
            const options = {
                output: './custom-docs/',
                name: 'My App',
                silent: true
            };
            
            // Stub Configuration.mainData to track changes
            const configStub = sandbox.stub(Configuration, 'mainData').value({
                output: './documentation/',
                documentationMainName: 'compodoc'
            });

            application = new Application(options);
            
            // Verify lines 87-89: option loop and configuration setting
            expect(configStub.output).to.equal('./custom-docs/');
        });

        it('should handle documentationMainName option - line 92-93', () => {
            const options = { name: 'Custom App Name' };
            
            Configuration.mainData.documentationMainName = 'compodoc';
            application = new Application(options);
            
            // Verify line 92-93: documentationMainName setting
            expect(Configuration.mainData.documentationMainName).to.equal('Custom App Name');
        });

        it('should handle silent option - line 96-97', () => {
            const options = { silent: true };
            
            application = new Application(options);
            
            // Verify line 96-97: silent option processing
            expect(logger.silent).to.be.false; // Based on line 97
        });
    });

    describe('generate method', () => {
        beforeEach(() => {
            application = new Application();
        });

        it('should set up process listeners and initialize I18n - lines 106-107, 109', () => {
            const processOnStub = sandbox.stub(process, 'on');
            const i18nInitStub = sandbox.stub(I18nEngine, 'init');
            const htmlEngineStub = sandbox.stub(HtmlEngine, 'init').resolves();
            
            // Mock Configuration.mainData
            Configuration.mainData.language = 'en-US';
            Configuration.mainData.output = './docs';
            Configuration.mainData.exportFormat = 'html';
            Configuration.mainData.templates = './templates';

            // Stub processPackageJson to prevent actual execution
            const processPackageJsonStub = sandbox.stub(application as any, 'processPackageJson');

            application['generate']();

            // Verify lines 106-107: process event listeners
            expect(processOnStub.calledWith('unhandledRejection')).to.be.true;
            expect(processOnStub.calledWith('uncaughtException')).to.be.true;
            
            // Verify line 109: I18n initialization
            expect(i18nInitStub.calledWith('en-US')).to.be.true;
        });

        it('should fix output path format - lines 111, 114', () => {
            Configuration.mainData.output = './docs';
            Configuration.mainData.exportFormat = 'html';
            Configuration.mainData.templates = './templates';
            
            const htmlEngineStub = sandbox.stub(HtmlEngine, 'init').resolves();
            const processPackageJsonStub = sandbox.stub(application as any, 'processPackageJson');

            application['generate']();

            // Verify lines 111, 114: output path formatting
            expect(Configuration.mainData.output).to.equal('./docs/');
        });

        it('should handle non-html export format - lines 117-118', () => {
            Configuration.mainData.exportFormat = 'json';
            Configuration.mainData.output = './docs/';
            
            const processPackageJsonStub = sandbox.stub(application as any, 'processPackageJson');

            application['generate']();

            // Verify lines 117-118: non-html export format path
            expect(processPackageJsonStub.called).to.be.true;
        });

        it('should handle html export format - lines 120-122', () => {
            Configuration.mainData.exportFormat = 'html';
            Configuration.mainData.output = './docs/';
            Configuration.mainData.templates = './templates';
            
            const htmlEngineStub = sandbox.stub(HtmlEngine, 'init').resolves();
            const processPackageJsonStub = sandbox.stub(application as any, 'processPackageJson');

            application['generate']();

            // Verify lines 120-122: html format processing
            expect(htmlEngineStub.calledWith('./templates')).to.be.true;
        });
    });

    describe('event handlers', () => {
        beforeEach(() => {
            application = new Application();
        });

        it('should handle unhandled rejection - lines 131-132, 135', () => {
            const processExitStub = sandbox.stub(process, 'exit');
            const consoleLogStub = sandbox.stub(console, 'log');

            const handler = application['unhandledRejectionListener'];
            handler('test error', Promise.resolve());

            // Verify lines 131-132, 135: error logging and exit
            expect(consoleLogStub.calledWith('Unhandled Rejection at:', Promise.resolve(), 'reason:', 'test error')).to.be.true;
            expect(processExitStub.calledWith(1)).to.be.true;
        });

        it('should handle uncaught exception - lines 139-140, 143', () => {
            const processExitStub = sandbox.stub(process, 'exit');

            const handler = application['uncaughtExceptionListener'];
            handler(new Error('test error'));

            // Verify lines 139-140, 143: error logging and exit
            expect(processExitStub.calledWith(1)).to.be.true;
        });
    });

    describe('testCoverage method', () => {
        beforeEach(() => {
            application = new Application();
        });

        it('should call getDependenciesData - line 150', () => {
            const getDependenciesDataStub = sandbox.stub(application as any, 'getDependenciesData');

            application['testCoverage']();

            // Verify line 150: getDependenciesData call
            expect(getDependenciesDataStub.called).to.be.true;
        });
    });

    describe('file management methods', () => {
        beforeEach(() => {
            application = new Application();
        });

        it('should set files - line 158', () => {
            const files = ['file1.ts', 'file2.ts'];
            
            application.setFiles(files);

            // Verify line 158: files assignment
            expect(application['files']).to.deep.equal(files);
        });

        it('should set updated files - line 166', () => {
            const files = ['updated1.ts', 'updated2.ts'];
            
            application.setUpdatedFiles(files);

            // Verify line 166: updatedFiles assignment
            expect(application['updatedFiles']).to.deep.equal(files);
        });

        it('should reset files - lines 205-206', () => {
            // Set some initial values
            application['files'] = ['file1.ts'];
            application['updatedFiles'] = ['file2.ts'];
            application['watchChangedFiles'] = ['file3.ts'];

            application['resetWatchChangedFiles']();

            // Verify lines 205-206: files reset
            expect(application['updatedFiles']).to.deep.equal([]);
            expect(application['watchChangedFiles']).to.deep.equal([]);
        });
    });

    describe('processPackageJson method', () => {
        beforeEach(() => {
            application = new Application();
        });

        it('should process package.json successfully - lines 210-215, 219, 222-223, 225, 227', () => {
            const packageData = JSON.stringify({
                name: 'test-app',
                description: 'Test application description',
                dependencies: {
                    '@angular/core': '^15.0.0'
                }
            });

            const fileEngineStub = sandbox.stub(FileEngine, 'get').resolves(packageData);
            const processMarkdownsStub = sandbox.stub(application as any, 'processMarkdowns').resolves();
            
            // Set default configuration
            Configuration.mainData.documentationMainName = 'compodoc';
            Configuration.mainData.disableDependencies = false;

            application['processPackageJson']();
            
            // Allow async operations to complete
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Verify lines 210-215: package.json parsing and data assignment
                    expect(application['packageJsonData']).to.deep.equal(JSON.parse(packageData));
                    
                    // Verify line 219: documentation name setting
                    expect(Configuration.mainData.documentationMainName).to.equal('test-app documentation');
                    
                    // Verify lines 222-223: description setting
                    expect(Configuration.mainData.documentationMainDescription).to.equal('Test application description');
                    
                    // Verify line 225: angular version processing
                    expect(Configuration.mainData.angularVersion).to.be.a('string');
                    resolve(undefined);
                }, 100);
            });
        });

        it('should handle package.json error - lines 278-280, 282, 285-286', () => {
            const fileEngineStub = sandbox.stub(FileEngine, 'get').rejects('File not found');
            const processMarkdownsStub = sandbox.stub(application as any, 'processMarkdowns').resolves();
            const getDependenciesDataStub = sandbox.stub(application as any, 'getDependenciesData');
            const processExitStub = sandbox.stub(process, 'exit');

            application['processPackageJson']();
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Verify lines 278-280, 282: error handling and markdown processing
                    expect(processMarkdownsStub.called).to.be.true;
                    expect(getDependenciesDataStub.called).to.be.true;
                    resolve(undefined);
                }, 100);
            });
        });

        it('should handle markdown processing error - lines 285-286', () => {
            const fileEngineStub = sandbox.stub(FileEngine, 'get').rejects('File not found');
            const processMarkdownsStub = sandbox.stub(application as any, 'processMarkdowns').rejects('Markdown error');
            const processExitStub = sandbox.stub(process, 'exit');

            application['processPackageJson']();
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Verify lines 285-286: process exit on markdown error
                    expect(processExitStub.calledWith(1)).to.be.true;
                    resolve(undefined);
                }, 100);
            });
        });
    });

    describe('processPackagePeerDependencies method', () => {
        beforeEach(() => {
            application = new Application();
        });

        it('should process peer dependencies - lines 294-297', () => {
            const dependencies = { '@angular/core': '^15.0.0' };
            const hasPageStub = sandbox.stub(Configuration, 'hasPage').returns(false);
            const addPageStub = sandbox.stub(Configuration, 'addPage');

            application['processPackagePeerDependencies'](dependencies);

            // Verify lines 294-297: peer dependencies processing
            expect(Configuration.mainData.packagePeerDependencies).to.equal(dependencies);
            expect(hasPageStub.calledWith('dependencies')).to.be.true;
            expect(addPageStub.called).to.be.true;
        });
    });

    describe('processMarkdowns method', () => {
        beforeEach(() => {
            application = new Application();
        });

        it('should process markdown files - lines 324-330, 332-334, 336', () => {
            const markdownData = {
                rawData: '# README\nTest content',
                data: '<h1>README</h1><p>Test content</p>',
                markdown: { content: 'Test content' }
            };

            const getTraditionalMarkdownStub = sandbox.stub(MarkdownEngine, 'getTraditionalMarkdown')
                .resolves(markdownData);
            const hasPageStub = sandbox.stub(Configuration, 'hasPage').returns(false);
            const addPageStub = sandbox.stub(Configuration, 'addPage');

            return application['processMarkdowns']().then(() => {
                // Verify lines 324-330: markdown processing loop
                expect(getTraditionalMarkdownStub.called).to.be.true;
                
                // Verify lines 332-334, 336: README processing
                expect(Configuration.mainData.readme).to.be.true;
                expect(addPageStub.called).to.be.true;
            });
        });

        it('should handle markdown processing error gracefully', () => {
            const getTraditionalMarkdownStub = sandbox.stub(MarkdownEngine, 'getTraditionalMarkdown')
                .rejects('Markdown not found');

            return application['processMarkdowns']().then(() => {
                // Should complete without throwing
                expect(getTraditionalMarkdownStub.called).to.be.true;
            });
        });
    });

    describe('endCallback method', () => {
        beforeEach(() => {
            application = new Application();
        });

        it('should remove process listeners - lines 126-127', () => {
            const processRemoveListenerStub = sandbox.stub(process, 'removeListener');

            application['endCallback']();

            // Verify lines 126-127: process listener removal
            expect(processRemoveListenerStub.calledWith('unhandledRejection')).to.be.true;
            expect(processRemoveListenerStub.calledWith('uncaughtException')).to.be.true;
        });
    });

    describe('edge cases and error scenarios', () => {
        beforeEach(() => {
            application = new Application();
        });

        it('should handle empty options object', () => {
            const options = {};
            application = new Application(options);
            expect(application).to.be.instanceOf(Application);
        });

        it('should handle undefined options', () => {
            application = new Application(undefined);
            expect(application).to.be.instanceOf(Application);
        });

        it('should handle options with undefined configuration keys', () => {
            const options = { 
                nonExistentOption: 'value',
                output: './test-docs/'
            };
            
            Configuration.mainData.output = './docs/';
            application = new Application(options);
            
            // Should only set the valid option
            expect(Configuration.mainData.output).to.equal('./test-docs/');
        });
    });

    describe('promise-based methods coverage', () => {
        beforeEach(() => {
            application = new Application();
        });

        it('should handle successful markdown processing promise chain', (done) => {
            const markdownData = {
                rawData: '# Test\nContent',
                data: '<h1>Test</h1><p>Content</p>',
                markdown: { content: 'Content' }
            };

            sandbox.stub(MarkdownEngine, 'getTraditionalMarkdown').resolves(markdownData);
            sandbox.stub(Configuration, 'hasPage').returns(false);
            sandbox.stub(Configuration, 'addPage');

            application['processMarkdowns']().then(() => {
                done();
            }).catch(done);
        });

        it('should handle failed FileEngine.get in processPackageJson', (done) => {
            sandbox.stub(FileEngine, 'get').rejects(new Error('File read error'));
            sandbox.stub(application as any, 'processMarkdowns').resolves();
            sandbox.stub(application as any, 'getDependenciesData');

            // Don't stub process.exit for this test to see the error handling
            const originalExit = process.exit;
            process.exit = () => {
                process.exit = originalExit;
                done();
                return undefined as never;
            };

            application['processPackageJson']();
        });
    });
});
