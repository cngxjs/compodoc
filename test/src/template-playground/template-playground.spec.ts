import * as fs from 'node:fs';
import * as path from 'node:path';
import { exists, shell, temporaryDir } from '../helpers';

const tmp = temporaryDir();

describe('Template Playground', () => {
    let stdoutString;
    const distFolder = tmp.name;

    beforeAll(() => {
        tmp.create();

        // Create a simple test project with template playground enabled
        const compodocConfig = {
            templatePlayground: true
        };

        const configPath = path.join(tmp.name, '.compodocrc');
        fs.writeFileSync(configPath, JSON.stringify(compodocConfig));

        const ls = shell('node', [
            './bin/index-cli.js',
            '-p',
            './test/fixtures/sample-files/tsconfig.simple.json',
            '-c',
            configPath,
            '-d',
            distFolder
        ]);

        if (ls.stderr.toString() !== '') {
            console.error(`shell error: ${ls.stderr.toString()}`);
            throw new Error('error');
        }
        stdoutString = ls.stdout.toString();
    });

    afterAll(() => {
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
        const templatePlaygroundJsExists = exists(
            path.join(distFolder, 'js', 'template-playground.js')
        );
        const templatePlaygroundCssExists = exists(
            path.join(distFolder, 'styles', 'template-playground.css')
        );

        expect(templatePlaygroundJsExists).to.be.true;
        expect(templatePlaygroundCssExists).to.be.true;
    });

    it('should generate template playground as standalone page', () => {
        // Template playground should exist as a separate page, not in navigation
        const templatePlaygroundExists = exists(path.join(distFolder, 'template-playground.html'));
        expect(templatePlaygroundExists).to.be.true;

        // Verify it's a functional standalone page
        const templatePlaygroundContent = fs.readFileSync(
            path.join(distFolder, 'template-playground.html'),
            'utf8'
        );
        expect(templatePlaygroundContent).to.contain('Template Playground');
    });

    it('should include template playground dependencies when enabled', () => {
        const templatePlaygroundContent = fs.readFileSync(
            path.join(distFolder, 'template-playground.html'),
            'utf8'
        );

        // Check for required dependencies
        expect(templatePlaygroundContent).to.contain('monaco-editor');
        expect(templatePlaygroundContent).to.contain('handlebars.min.js');
        expect(templatePlaygroundContent).to.contain('jszip.min.js');
        expect(templatePlaygroundContent).to.contain('template-playground.js');
        expect(templatePlaygroundContent).to.contain('template-playground.css');
    });

    it('should contain template playground Angular component', () => {
        const templatePlaygroundContent = fs.readFileSync(
            path.join(distFolder, 'template-playground.html'),
            'utf8'
        );
        expect(templatePlaygroundContent).to.contain('template-playground-root');
        expect(templatePlaygroundContent).to.contain('template-playground-container');
    });
});

describe('Template Playground Configuration', () => {
    it('should not generate template playground when disabled', () => {
        const tmpDisabled = temporaryDir();
        tmpDisabled.create();

        const compodocConfig = {
            templatePlayground: false
        };

        const configPathDisabled = path.join(tmpDisabled.name, '.compodocrc');
        fs.writeFileSync(configPathDisabled, JSON.stringify(compodocConfig));

        const ls = shell('node', [
            './bin/index-cli.js',
            '-p',
            './test/fixtures/sample-files/tsconfig.simple.json',
            '-c',
            configPathDisabled,
            '-d',
            tmpDisabled.name
        ]);

        const templatePlaygroundExists = exists(
            path.join(tmpDisabled.name, 'template-playground.html')
        );
        expect(templatePlaygroundExists).to.be.false;

        tmpDisabled.clean();
    });

    it('should handle template playground flag via CLI', () => {
        const tmpCli = temporaryDir();
        tmpCli.create();

        const ls = shell('node', [
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
    });
});

describe('Template Playground Integration', () => {
    it('should maintain existing functionality when template playground is enabled', () => {
        const tmpIntegration = temporaryDir();
        tmpIntegration.create();

        const compodocConfig = {
            templatePlayground: true
        };

        const configPathIntegration = path.join(tmpIntegration.name, '.compodocrc');
        fs.writeFileSync(configPathIntegration, JSON.stringify(compodocConfig));

        const ls = shell('node', [
            './bin/index-cli.js',
            '-p',
            './test/fixtures/sample-files/tsconfig.simple.json',
            '-c',
            configPathIntegration,
            '-d',
            tmpIntegration.name
        ]);

        // Check that existing functionality still works
        const isIndexExists = exists(path.join(tmpIntegration.name, 'index.html'));
        const isModulesExists = exists(path.join(tmpIntegration.name, 'modules.html'));

        // Check that individual component pages exist (not a components.html index)
        const barComponentExists = exists(
            path.join(tmpIntegration.name, 'components', 'BarComponent.html')
        );
        const fooComponentExists = exists(
            path.join(tmpIntegration.name, 'components', 'FooComponent.html')
        );

        expect(isIndexExists).to.be.true;
        expect(isModulesExists).to.be.true;
        expect(barComponentExists).to.be.true;
        expect(fooComponentExists).to.be.true;

        tmpIntegration.clean();
    });
});
