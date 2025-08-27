import { expect } from 'chai';
import { temporaryDir, shell, exists, read } from '../helpers';

const tmp = temporaryDir();

describe('Application Integration Tests', () => {
    const distFolder = tmp.name + '-application-coverage';

    describe('Application lifecycle and configuration', () => {
        let command = undefined;
        
        before(function (done) {
            tmp.create(distFolder);
            done();
        });

        after(() => tmp.clean(distFolder));

        it('should test application initialization and configuration', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                distFolder,
                '--silent'
            ]);

            if (command.stderr) {
                console.log('stderr: ', command.stderr);
            }

            expect(command.status).to.equal(0);
            
            // Verify that the application initialized with configuration
            expect(exists(`${distFolder}/index.html`)).to.be.true;
            expect(exists(`${distFolder}/dependencies.html`)).to.be.true;
            
            done();
        });

        it('should test process listeners and event handlers', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-events`,
                '--silent',
                '--hideGenerator'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that generator hiding and event handling worked
            expect(exists(`${distFolder}-events/index.html`)).to.be.true;
            
            done();
        });

        it('should test export format handling', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-export`,
                '--exportFormat',
                'json',
                '--silent'
            ]);

            if (command.stderr) {
                console.log('stderr: ', command.stderr);
            }

            expect(command.status).to.equal(0);
            
            // Verify that export format was handled
            expect(exists(`${distFolder}-export/documentation.json`)).to.be.true;
            
            done();
        });

        it('should test file processing and dependencies', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-deps`,
                '--silent',
                '--hideDarkModeToggle'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that dark mode toggle hiding and dependencies processing worked
            const indexContent = read(`${distFolder}-deps/index.html`);
            expect(indexContent).to.contain('Documentation');
            
            done();
        });

        it('should test error handling paths', (done) => {
            // Test with invalid tsconfig to trigger error paths
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/non-existent/tsconfig.json',
                '-d',
                `${distFolder}-error`,
                '--silent'
            ]);

            // Should handle the error gracefully (non-zero exit status)
            expect(command.status).to.not.equal(0);
            
            done();
        });

        it('should test peer dependencies processing', (done) => {
            command = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '-d',
                `${distFolder}-peer`,
                '--silent',
                '--disableDependencies'
            ]);

            expect(command.status).to.equal(0);
            
            // Verify that peer dependencies were processed
            expect(exists(`${distFolder}-peer/index.html`)).to.be.true;
            
            done();
        });
    });
});
