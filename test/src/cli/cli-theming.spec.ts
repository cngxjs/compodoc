import path from 'path';
import { hasStderrError, temporaryDir, shell, exists, read } from '../helpers';
import fs from 'fs-extra';

const tmp = temporaryDir();

describe('CLI theming', () => {
    describe('built-in themes', () => {
        const distFolder = tmp.name + '-theme-builtin';

        beforeAll(() => {
            tmp.create(distFolder);
            shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/todomvc-ng2/src/tsconfig.json',
                '-d',
                distFolder,
                '--theme',
                'ocean',
                '--disableSearch',
                '--silent'
            ]);
        });
        afterAll(() => tmp.clean(distFolder));

        it('should copy ocean.css to output styles', () => {
            expect(exists(`${distFolder}/styles/ocean.css`)).to.be.true;
        });

        it('should set theme link href to ocean.css', () => {
            const index = read(`${distFolder}/index.html`);
            expect(index).to.contain('styles/ocean.css');
        });

        it('should hide theme picker when theme is locked', () => {
            const index = read(`${distFolder}/index.html`);
            expect(index).to.not.contain('data-cdx-theme-picker');
        });

        it('should include all built-in theme files', () => {
            expect(exists(`${distFolder}/styles/ocean.css`)).to.be.true;
            expect(exists(`${distFolder}/styles/ember.css`)).to.be.true;
            expect(exists(`${distFolder}/styles/midnight.css`)).to.be.true;
        });

        it('should not ship theme-template.css in output', () => {
            expect(exists(`${distFolder}/styles/theme-template.css`)).to.be.false;
        });
    });

    describe('default theme', () => {
        const distFolder = tmp.name + '-theme-default';

        beforeAll(() => {
            tmp.create(distFolder);
            shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/todomvc-ng2/src/tsconfig.json',
                '-d',
                distFolder,
                '--disableSearch',
                '--silent'
            ]);
        });
        afterAll(() => tmp.clean(distFolder));

        it('should show theme picker when using default theme', () => {
            const index = read(`${distFolder}/index.html`);
            expect(index).to.contain('data-cdx-theme-picker');
        });

        it('should set empty theme link href for default', () => {
            const index = read(`${distFolder}/index.html`);
            expect(index).to.match(/id="cdx-theme-link"[^>]*href=""/);
        });
    });

    describe('custom theme file', () => {
        const distFolder = tmp.name + '-theme-custom';
        const customThemePath = path.resolve(__dirname, '../../fixtures/custom-test-theme.css');

        beforeAll(() => {
            tmp.create(distFolder);
            fs.writeFileSync(
                customThemePath,
                `/* @theme Test */\n:root { --color-cdx-primary: #e11d48; }\n`
            );
            shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/todomvc-ng2/src/tsconfig.json',
                '-d',
                distFolder,
                '--theme',
                customThemePath,
                '--disableSearch',
                '--silent'
            ]);
        });
        afterAll(() => {
            tmp.clean(distFolder);
            fs.removeSync(customThemePath);
        });

        it('should copy custom theme to styles/custom.css', () => {
            expect(exists(`${distFolder}/styles/custom.css`)).to.be.true;
        });

        it('should contain the custom token override', () => {
            const css = read(`${distFolder}/styles/custom.css`);
            expect(css).to.contain('#e11d48');
        });

        it('should set theme link href to custom.css', () => {
            const index = read(`${distFolder}/index.html`);
            expect(index).to.contain('styles/custom.css');
        });

        it('should hide theme picker for custom theme', () => {
            const index = read(`${distFolder}/index.html`);
            expect(index).to.not.contain('data-cdx-theme-picker');
        });
    });

    describe('custom theme file not found', () => {
        it('should exit with error for missing file', () => {
            const result = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/todomvc-ng2/src/tsconfig.json',
                '-d',
                '/tmp/compodoc-theme-missing',
                '--theme',
                './nonexistent-theme.css',
                '--disableSearch',
                '--silent'
            ]);
            expect(result.status).to.not.equal(0);
        });
    });

    describe('built-in theme token coverage', () => {
        const requiredTokens = [
            '--color-cdx-bg:',
            '--color-cdx-primary:',
            '--color-cdx-entity-component:',
            '--color-cdx-entity-service:',
            '--color-cdx-entity-module:',
            '--color-cdx-deprecated:',
            '--color-cdx-border:',
            '--color-cdx-border-strong:',
            '--shadow-cdx-sm:'
        ];

        for (const theme of ['ocean', 'ember', 'midnight']) {
            it(`${theme}.css should contain all critical token groups`, () => {
                const css = read(`src/resources/styles/${theme}.css`);
                for (const token of requiredTokens) {
                    expect(css).to.contain(token);
                }
            });

            it(`${theme}.css should have both :root and .dark blocks`, () => {
                const css = read(`src/resources/styles/${theme}.css`);
                expect(css).to.contain(':root');
                expect(css).to.contain('.dark');
            });

            it(`${theme}.css should have entity colors in both modes`, () => {
                const css = read(`src/resources/styles/${theme}.css`);
                const rootMatch = css.match(/:root\s*\{([^}]+)\}/s);
                const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/s);
                expect(rootMatch).to.not.be.null;
                expect(darkMatch).to.not.be.null;
                expect(rootMatch![1]).to.contain('--color-cdx-entity-component');
                expect(darkMatch![1]).to.contain('--color-cdx-entity-component');
            });
        }
    });

    describe('--shikiTheme flag', () => {
        const distFolder = tmp.name + '-theme-shiki';

        beforeAll(() => {
            tmp.create(distFolder);
            shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/todomvc-ng2/src/tsconfig.json',
                '-d',
                distFolder,
                '--shikiTheme',
                'nord:nord',
                '--disableSearch',
                '--silent'
            ]);
        });
        afterAll(() => tmp.clean(distFolder));

        it('should generate docs with custom shiki theme', () => {
            expect(exists(`${distFolder}/index.html`)).to.be.true;
        });

        it('should use the specified shiki theme in output', () => {
            const index = read(`${distFolder}/index.html`);
            expect(index).to.contain('nord');
        });
    });
});
