import * as fs from 'node:fs';
import * as path from 'node:path';
import { exists, hasStderrError, read, shell, temporaryDir } from '../helpers';

const tmp = temporaryDir();

describe('CLI Theming tab generation', () => {
    const distFolder = `${tmp.name}-theming-tab`;
    const fixtureFolder = `${tmp.name}-theming-tab-fixture`;

    const tsconfigContent = {
        compilerOptions: {
            target: 'es5',
            module: 'commonjs',
            moduleResolution: 'node',
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            lib: ['es2015', 'dom']
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules']
    };

    describe('when theme files sit next to an entity source file', () => {
        let stdoutString: string;
        let componentHtml: string;
        let plainComponentHtml: string;

        beforeAll(() => {
            tmp.create(fixtureFolder);
            tmp.create(distFolder);

            const srcFolder = path.join(fixtureFolder, 'src');
            fs.mkdirSync(srcFolder, { recursive: true });

            const themedFolder = path.join(srcFolder, 'themed');
            fs.mkdirSync(themedFolder, { recursive: true });
            fs.writeFileSync(
                path.join(themedFolder, 'button.component.ts'),
                `import { Component } from '@angular/core';\n` +
                    `@Component({ selector: 'app-button', template: '<button></button>' })\n` +
                    `export class ButtonComponent {}\n`
            );
            fs.writeFileSync(
                path.join(themedFolder, 'button-theme.scss'),
                `$primary: #00ffcc;\n.btn { color: $primary; }\n`
            );
            fs.writeFileSync(
                path.join(themedFolder, 'button.theme.md'),
                `# Button theming\n\nUse \`--btn-color\` to override the primary shade.\n`
            );

            const plainFolder = path.join(srcFolder, 'plain');
            fs.mkdirSync(plainFolder, { recursive: true });
            fs.writeFileSync(
                path.join(plainFolder, 'plain.component.ts'),
                `import { Component } from '@angular/core';\n` +
                    `@Component({ selector: 'app-plain', template: '<div></div>' })\n` +
                    `export class PlainComponent {}\n`
            );

            fs.writeFileSync(
                path.join(srcFolder, 'app.module.ts'),
                `import { NgModule } from '@angular/core';\n` +
                    `import { ButtonComponent } from './themed/button.component';\n` +
                    `import { PlainComponent } from './plain/plain.component';\n` +
                    `@NgModule({ declarations: [ButtonComponent, PlainComponent] })\n` +
                    `export class AppModule {}\n`
            );

            fs.writeFileSync(
                path.join(fixtureFolder, 'tsconfig.json'),
                JSON.stringify(tsconfigContent, null, 2)
            );

            const ls = shell('node', [
                './bin/index-cli.js',
                '-p',
                path.join(fixtureFolder, 'tsconfig.json'),
                '-d',
                distFolder
            ]);

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('error');
            }
            stdoutString = ls.stdout.toString();
            componentHtml = read(`${distFolder}/components/ButtonComponent.html`);
            plainComponentHtml = read(`${distFolder}/components/PlainComponent.html`);
        });

        afterAll(() => {
            tmp.clean(distFolder);
            tmp.clean(fixtureFolder);
        });

        it('documentation generated successfully', () => {
            expect(stdoutString).to.contain('Documentation generated');
        });

        it('renders the theming panel for components with theme files', () => {
            expect(componentHtml).to.contain('id="theming"');
            expect(componentHtml).to.contain('data-compodoc="block-theming"');
        });

        it('includes the theming tab in the header for that component', () => {
            expect(componentHtml).to.contain('theming-tab');
            expect(componentHtml).to.contain('#theming');
        });

        it('renders the SCSS theme file content as a highlighted block', () => {
            expect(componentHtml).to.contain('button-theme.scss');
            expect(componentHtml).to.match(/class="[^"]*shiki/);
            expect(componentHtml).to.contain('primary');
        });

        it('renders the Markdown theme file as prose', () => {
            expect(componentHtml).to.contain('button.theme.md');
            expect(componentHtml).to.contain('cdx-prose');
            expect(componentHtml).to.contain('Button theming');
        });

        it('does NOT render the theming tab on components without theme files', () => {
            expect(exists(`${distFolder}/components/PlainComponent.html`)).to.be.true;
            expect(plainComponentHtml).to.not.contain('id="theming"');
            expect(plainComponentHtml).to.not.contain('data-compodoc="block-theming"');
        });
    });
});
