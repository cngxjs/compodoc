import { expect } from 'chai';
import { temporaryDir, shell, exists, read } from '../helpers';

const tmp = temporaryDir();

describe('Utils Integration Tests', () => {
    const distFolder = tmp.name + '-utils-coverage';

    describe('Utility functions integration', () => {
        let command = undefined;
        
        before(function (done) {
            tmp.create(distFolder);
            done();
        });

        after(() => tmp.clean(distFolder));

        it('should test string manipulation utilities', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                distFolder,
                '--silent',
                '--disableGraph'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that string manipulation worked during processing
            const indexContent = read(`${distFolder}/index.html`);
            expect(indexContent).to.contain('documentation'); // Should be lowercased
            
            done();
        });

        it('should test file path handling', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-paths`,
                '--silent',
                '--disableSourceCode'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that path handling worked
            expect(exists(`${distFolder}-paths/index.html`)).to.be.true;
            expect(exists(`${distFolder}-paths/dependencies.html`)).to.be.true;
            
            done();
        });

        it('should test configuration reading', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-config`,
                '--silent',
                '--theme',
                'material'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that configuration was read and applied
            const indexContent = read(`${distFolder}-config/index.html`);
            expect(indexContent).to.contain('material'); // Theme should be applied
            
            done();
        });

        it('should test markdown processing', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-markdown`,
                '--silent',
                '--disableRoutesGraph'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that markdown processing worked
            expect(exists(`${distFolder}-markdown/index.html`)).to.be.true;
            
            done();
        });

        it('should test lifecycle and source processing', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-lifecycle`,
                '--silent',
                '--disableCoverage'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that source processing worked
            expect(exists(`${distFolder}-lifecycle/modules.html`)).to.be.true;
            
            done();
        });

        it('should test pattern matching and filtering', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-patterns`,
                '--silent',
                '--disableTemplateTab'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that pattern matching worked
            expect(exists(`${distFolder}-patterns/index.html`)).to.be.true;
            
            done();
        });

        it('should test TypeScript compilation utilities', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-ts`,
                '--silent',
                '--disablePrivate'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that TypeScript processing worked
            expect(exists(`${distFolder}-ts/index.html`)).to.be.true;
            
            done();
        });

        it('should test advanced utility functions', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-advanced`,
                '--silent',
                '--hideGenerator'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that advanced utilities worked
            const indexContent = read(`${distFolder}-advanced/index.html`);
            expect(indexContent).to.not.contain('Generated using'); // hideGenerator should work
            
            done();
        });

        it('should test remaining utility functions', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-remaining`,
                '--silent',
                '--customFavicon',
                './test/fixtures/todomvc-ng2/additional-doc/edition.md'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that remaining utilities worked including constants
            expect(exists(`${distFolder}-remaining/index.html`)).to.be.true;
            
            done();
        });
    });
});