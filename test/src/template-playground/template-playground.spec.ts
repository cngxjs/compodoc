import { expect } from 'chai';
import { temporaryDir, shell, exists } from '../helpers';
import * as fs from 'fs';
import * as path from 'path';

const tmp = temporaryDir();

describe('Template Playground', () => {
    let stdoutString = undefined;
    const distFolder = tmp.name;

    before(done => {
        tmp.create();

        // Create a simple test project with template playground enabled
        const compodocConfig = {
            "templatePlayground": true
        };

        fs.writeFileSync(path.join(tmp.name, '.compodocrc'), JSON.stringify(compodocConfig));

        let ls = shell('node', [
            './bin/index-cli.js',
            '-p',
            './test/fixtures/sample-files/tsconfig.simple.json',
            '-c',
            '.compodocrc',
            '-d',
            distFolder
        ]);

        if (ls.stderr.toString() !== '') {
            console.error(`shell error: ${ls.stderr.toString()}`);
            done('error');
        }
        stdoutString = ls.stdout.toString();
        done();
    });

    after(() => {
        tmp.clean();
    });

    it('should display generated message', () => {
        expect(stdoutString).to.contain('Documentation generated');
    });

    it('should have generated template playground page', () => {
        const templatePlaygroundExists = exists(path.join(distFolder, 'template-playground.html'));
        expect(templatePlaygroundExists).to.be.true;
    });

    it('should have generated template playground resources', () => {
        const templatePlaygroundJsExists = exists(path.join(distFolder, 'js', 'template-playground.js'));
        const templatePlaygroundCssExists = exists(path.join(distFolder, 'styles', 'template-playground.css'));

        expect(templatePlaygroundJsExists).to.be.true;
        expect(templatePlaygroundCssExists).to.be.true;
    });

    it('should have template playground in navigation menu', () => {
        const indexContent = fs.readFileSync(path.join(distFolder, 'index.html'), 'utf8');
        expect(indexContent).to.contain('template-playground.html');
        expect(indexContent).to.contain('Customize Templates');
    });

    it('should include template playground dependencies when enabled', () => {
        const templatePlaygroundContent = fs.readFileSync(path.join(distFolder, 'template-playground.html'), 'utf8');

        // Check for required dependencies
        expect(templatePlaygroundContent).to.contain('monaco-editor');
        expect(templatePlaygroundContent).to.contain('handlebars.min.js');
        expect(templatePlaygroundContent).to.contain('jszip.min.js');
        expect(templatePlaygroundContent).to.contain('template-playground.js');
        expect(templatePlaygroundContent).to.contain('template-playground.css');
    });

    it('should contain template playground Angular component', () => {
        const templatePlaygroundContent = fs.readFileSync(path.join(distFolder, 'template-playground.html'), 'utf8');
        expect(templatePlaygroundContent).to.contain('template-playground-root');
        expect(templatePlaygroundContent).to.contain('template-playground-container');
    });
});

describe('Template Playground Configuration', () => {
    it('should not generate template playground when disabled', (done) => {
        const tmpDisabled = temporaryDir();
        tmpDisabled.create();

        const compodocConfig = {
            "templatePlayground": false
        };

        fs.writeFileSync(path.join(tmpDisabled.name, '.compodocrc'), JSON.stringify(compodocConfig));

        let ls = shell('node', [
            './bin/index-cli.js',
            '-p',
            './test/fixtures/sample-files/tsconfig.simple.json',
            '-c',
            '.compodocrc',
            '-d',
            tmpDisabled.name
        ]);

        const templatePlaygroundExists = exists(path.join(tmpDisabled.name, 'template-playground.html'));
        expect(templatePlaygroundExists).to.be.false;

        tmpDisabled.clean();
        done();
    });

    it('should handle template playground flag via CLI', (done) => {
        const tmpCli = temporaryDir();
        tmpCli.create();

        let ls = shell('node', [
            './bin/index-cli.js',
            '-p',
            './test/fixtures/sample-files/tsconfig.simple.json',
            '--templatePlayground',
            '-d',
            tmpCli.name
        ]);

        const templatePlaygroundExists = exists(path.join(tmpCli.name, 'template-playground.html'));
        expect(templatePlaygroundExists).to.be.true;

        tmpCli.clean();
        done();
    });
});

describe('Template Playground Integration', () => {
    it('should maintain existing functionality when template playground is enabled', (done) => {
        const tmpIntegration = temporaryDir();
        tmpIntegration.create();

        const compodocConfig = {
            "templatePlayground": true
        };

        fs.writeFileSync(path.join(tmpIntegration.name, '.compodocrc'), JSON.stringify(compodocConfig));

        let ls = shell('node', [
            './bin/index-cli.js',
            '-p',
            './test/fixtures/sample-files/tsconfig.simple.json',
            '-c',
            '.compodocrc',
            '-d',
            tmpIntegration.name
        ]);

        // Check that existing functionality still works
        const isIndexExists = exists(path.join(tmpIntegration.name, 'index.html'));
        const isModulesExists = exists(path.join(tmpIntegration.name, 'modules.html'));
        const isComponentsExists = exists(path.join(tmpIntegration.name, 'components.html'));

        expect(isIndexExists).to.be.true;
        expect(isModulesExists).to.be.true;
        expect(isComponentsExists).to.be.true;

        tmpIntegration.clean();
        done();
    });
});
