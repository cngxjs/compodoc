import { buildPlaygroundManifest } from '../../../../../src/app/engines/stackblitz/build-playground-manifest';
import {
    STACKBLITZ_FILE_CAP,
    STACKBLITZ_TEMPLATE
} from '../../../../../src/app/engines/stackblitz/constants';
import type { DepGraphNode } from '../../../../../src/app/engines/stackblitz/walk-dep-graph';
import type { ComponentPlaygroundBlock } from '../../../../../src/templates/helpers/jsdoc';

const block: ComponentPlaygroundBlock = {
    title: 'Default state',
    snippet: '<my-button label="Click me" />',
    language: 'html',
    line: 0
};

const rootNode: DepGraphNode = {
    name: 'MyButton',
    file: 'src/app/my-button/my-button.component.ts',
    sourceCode: 'export class MyButton {}\n',
    imports: []
};

const resolverFor = (nodes: DepGraphNode[]) => {
    const map = new Map(nodes.map(n => [n.name, n]));
    return (name: string) => map.get(name) ?? null;
};

const consumerPkg = {
    dependencies: {
        '@angular/core': '^21.0.0',
        '@angular/common': '^21.0.0',
        'random-other-pkg': '^1.0.0'
    }
};

describe('buildPlaygroundManifest', () => {
    it('emits a complete Angular CLI 21 standalone project', () => {
        const result = buildPlaygroundManifest(
            'MyButton',
            block,
            resolverFor([rootNode]),
            consumerPkg
        );
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        expect(result.value.template).to.equal(STACKBLITZ_TEMPLATE);
        expect(result.value.title).to.equal('Default state');
        expect(result.value.files).to.have.property('package.json');
        expect(result.value.files).to.have.property('angular.json');
        expect(result.value.files).to.have.property('tsconfig.json');
        expect(result.value.files).to.have.property('tsconfig.app.json');
        expect(result.value.files).to.have.property('src/index.html');
        expect(result.value.files).to.have.property('src/styles.css');
        expect(result.value.files).to.have.property('src/main.ts');
        expect(result.value.files).to.have.property('src/app/app.config.ts');
        expect(result.value.files).to.have.property('src/app/app.component.ts');

        const pkg = JSON.parse(result.value.files['package.json']);
        expect(pkg.scripts.start).to.equal('ng serve');
        expect(pkg.dependencies['@angular/core']).to.match(/^\^?\d/);
        expect(pkg.devDependencies['@angular/cli']).to.match(/^\^?\d/);
        expect(pkg.devDependencies['@angular/build']).to.match(/^\^?\d/);
        expect(pkg.devDependencies['@angular/compiler-cli']).to.match(/^\^?\d/);
        expect(pkg.devDependencies.typescript).to.match(/^[~^]?\d/);

        const ng = JSON.parse(result.value.files['angular.json']);
        const proj = ng.projects['compodocx-playground'];
        expect(proj.architect.build.builder).to.equal('@angular/build:application');
        expect(proj.architect.build.options.polyfills).to.deep.equal(['zone.js']);
        expect(proj.architect.build.options.browser).to.equal('src/main.ts');
        expect(proj.architect.serve.builder).to.equal('@angular/build:dev-server');

        expect(result.value.files['src/main.ts']).to.contain('bootstrapApplication(AppComponent');
        expect(result.value.files['src/index.html']).to.contain('<app-root>');
        expect(result.value.files['src/app/app.config.ts']).to.contain(
            'provideZoneChangeDetection'
        );
        expect(result.value.files['src/app/app.component.ts']).to.contain("selector: 'app-root'");

        // SDK options: WebContainer needs startScript='start' to actually run.
        expect(result.value.template).to.equal('node');
        expect(result.value.startScript).to.equal('start');
        expect(result.value.openFile).to.equal('src/app/app.component.ts');
    });

    it("imports the component from the root node's actual file basename, not its class name", () => {
        const result = buildPlaygroundManifest(
            'MyButton',
            block,
            resolverFor([rootNode]),
            consumerPkg
        );
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        // Root file is `src/app/my-button/my-button.component.ts` — the
        // AppComponent must `import { MyButton } from './my-button.component'`,
        // not `'./MyButton'`.
        const appComponent = result.value.files['src/app/app.component.ts'];
        expect(appComponent).to.contain("from './my-button.component'");
        expect(appComponent).not.to.contain("from './MyButton'");
        expect(appComponent).to.contain('imports: [MyButton]');
    });

    it('respects the dep walker depth cap', () => {
        const nodes: DepGraphNode[] = [
            { ...rootNode, imports: ['DepA'] },
            {
                name: 'DepA',
                file: 'src/app/dep-a.ts',
                sourceCode: 'export class DepA {}',
                imports: ['DepB']
            },
            {
                name: 'DepB',
                file: 'src/app/dep-b.ts',
                sourceCode: 'export class DepB {}',
                imports: []
            }
        ];
        const result = buildPlaygroundManifest('MyButton', block, resolverFor(nodes), consumerPkg, {
            depth: 1
        });
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        expect(Object.keys(result.value.files)).to.contain('src/app/dep-a.ts');
        expect(Object.keys(result.value.files)).not.to.contain('src/app/dep-b.ts');
    });

    it('returns Result.err when the file-count cap aborts the walk', () => {
        const many = Array.from({ length: 30 }, (_, i) => `Dep${i}`);
        const nodes: DepGraphNode[] = [
            { ...rootNode, imports: many },
            ...many.map(name => ({
                name,
                file: `src/app/${name.toLowerCase()}.ts`,
                sourceCode: `export const ${name} = 1;`,
                imports: []
            }))
        ];
        const result = buildPlaygroundManifest('MyButton', block, resolverFor(nodes), consumerPkg);
        expect(result.ok).to.be.false;
    });

    it('falls back to a known-good Angular major when the consumer omits all peers', () => {
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([rootNode]), {});
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        // Default fallback bumps with the toolchain. Whatever it is, every
        // Angular peer must share the same version.
        const fallback = result.value.dependencies['@angular/core'];
        expect(fallback).to.match(/^\^?\d/);
        expect(result.value.dependencies['@angular/common']).to.equal(fallback);
        expect(result.value.dependencies['@angular/forms']).to.equal(fallback);
        expect(result.value.dependencies['@angular/compiler']).to.equal(fallback);
    });

    it('aligns every @angular/* peer on the consumer @angular/core version', () => {
        const pkg = { dependencies: { '@angular/core': '^21.0.0' } };
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([rootNode]), pkg);
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        // None of the other Angular peers were declared by the consumer;
        // they must inherit the @angular/core spec, not fall back independently.
        expect(result.value.dependencies['@angular/common']).to.equal('^21.0.0');
        expect(result.value.dependencies['@angular/router']).to.equal('^21.0.0');
        expect(result.value.dependencies['@angular/platform-browser']).to.equal('^21.0.0');
        expect(result.value.dependencies['@angular/compiler']).to.equal('^21.0.0');
    });

    it('always emits zone.js, rxjs, and tslib peers required for an ng-cli boot', () => {
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([rootNode]), {});
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        expect(result.value.dependencies).to.have.property('zone.js');
        expect(result.value.dependencies).to.have.property('rxjs');
        expect(result.value.dependencies).to.have.property('tslib');
    });

    it('forwards @angular/material and @angular/cdk only when the consumer declares them', () => {
        const pkg = {
            dependencies: {
                '@angular/core': '^21.0.0',
                '@angular/material': '^21.0.0',
                '@angular/cdk': '^21.0.0'
            }
        };
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([rootNode]), pkg);
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        expect(result.value.dependencies['@angular/material']).to.equal('^21.0.0');
        expect(result.value.dependencies['@angular/cdk']).to.equal('^21.0.0');
    });

    it('omits @angular/material and @angular/cdk when the consumer does not declare them', () => {
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([rootNode]), {});
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        expect(result.value.dependencies).not.to.have.property('@angular/material');
        expect(result.value.dependencies).not.to.have.property('@angular/cdk');
    });

    it('auto-detects Material modules in the snippet and wires imports + theme', () => {
        const matBlock: ComponentPlaygroundBlock = {
            ...block,
            snippet:
                '<mat-card><mat-card-content>Hi</mat-card-content></mat-card>' +
                '<button mat-raised-button>Save</button>'
        };
        const result = buildPlaygroundManifest(
            'MyButton',
            matBlock,
            resolverFor([rootNode]),
            consumerPkg
        );
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        // Auto-pinned because the snippet referenced mat-* tags.
        expect(result.value.dependencies).to.have.property('@angular/material');
        expect(result.value.dependencies).to.have.property('@angular/cdk');

        const appComponent = result.value.files['src/app/app.component.ts'];
        expect(appComponent).to.contain("import { MatCardModule } from '@angular/material/card'");
        expect(appComponent).to.contain(
            "import { MatButtonModule } from '@angular/material/button'"
        );
        expect(appComponent).to.contain('imports: [MyButton, MatButtonModule, MatCardModule]');

        // Prebuilt theme threaded into angular.json's styles list.
        const ng = JSON.parse(result.value.files['angular.json']);
        const styles = ng.projects['compodocx-playground'].architect.build.options.styles;
        expect(styles).to.contain('@angular/material/prebuilt-themes/azure-blue.css');
    });

    it('does not pull Material into the manifest when the snippet is plain HTML', () => {
        const result = buildPlaygroundManifest(
            'MyButton',
            block,
            resolverFor([rootNode]),
            consumerPkg
        );
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        const appComponent = result.value.files['src/app/app.component.ts'];
        expect(appComponent).not.to.contain('@angular/material');
        const ng = JSON.parse(result.value.files['angular.json']);
        const styles = ng.projects['compodocx-playground'].architect.build.options.styles;
        expect(styles).not.to.contain('@angular/material/prebuilt-themes/azure-blue.css');

        const indexHtml = result.value.files['src/index.html'];
        expect(indexHtml).not.to.contain('mat-typography');
        expect(indexHtml).not.to.contain('Roboto');
    });

    it('injects Roboto/Icons fonts and mat-typography classes when Material is detected', () => {
        const matBlock: ComponentPlaygroundBlock = {
            ...block,
            snippet: '<mat-card>Hi</mat-card>'
        };
        const result = buildPlaygroundManifest(
            'MyButton',
            matBlock,
            resolverFor([rootNode]),
            consumerPkg
        );
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        const indexHtml = result.value.files['src/index.html'];
        expect(indexHtml).to.contain('fonts.googleapis.com/css2?family=Roboto');
        expect(indexHtml).to.contain('Material+Icons');
        expect(indexHtml).to.contain('<body class="mat-typography mat-app-background">');
    });

    it('preserves the snippet language inside the demo component template', () => {
        const tsBlock: ComponentPlaygroundBlock = {
            ...block,
            snippet: 'const x = 1;',
            language: 'typescript'
        };
        const result = buildPlaygroundManifest(
            'MyButton',
            tsBlock,
            resolverFor([rootNode]),
            consumerPkg
        );
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        const appComponent = result.value.files['src/app/app.component.ts'];
        expect(appComponent).to.contain('<pre><code>const x = 1;</code></pre>');
    });

    it('caps oversized source files at STACKBLITZ_FILE_CAP via the file emitter (F23/F24)', () => {
        const fat: DepGraphNode = {
            ...rootNode,
            sourceCode: 'a'.repeat(STACKBLITZ_FILE_CAP * 2)
        };
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([fat]), consumerPkg);
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        const fileBody = result.value.files['src/app/my-button.component.ts'];
        expect(fileBody.length).to.be.lessThan(STACKBLITZ_FILE_CAP * 2);
        expect(fileBody).to.contain('truncated by compodocx');
    });

    it('produces byte-equal manifests for the same input (idempotency)', () => {
        const a = buildPlaygroundManifest('MyButton', block, resolverFor([rootNode]), consumerPkg);
        const b = buildPlaygroundManifest('MyButton', block, resolverFor([rootNode]), consumerPkg);
        expect(a.ok && b.ok).to.be.true;
        if (a.ok && b.ok) {
            expect(JSON.stringify(a.value)).to.equal(JSON.stringify(b.value));
        }
    });

    it('auto-forwards a third-party library imported by the inlined component source', () => {
        const node: DepGraphNode = {
            ...rootNode,
            sourceCode:
                "import { CngxButton } from '@my-org/ui-kit';\n" +
                "import { fmt } from 'date-helper';\n" +
                'export class MyButton {}\n',
            imports: []
        };
        const pkg = {
            dependencies: {
                '@angular/core': '^21.0.0',
                '@my-org/ui-kit': '^2.5.0',
                'date-helper': '~1.0.3'
            }
        };
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([node]), pkg);
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        expect(result.value.dependencies['@my-org/ui-kit']).to.equal('^2.5.0');
        expect(result.value.dependencies['date-helper']).to.equal('~1.0.3');
    });

    it('skips auto-forwarded libraries the consumer does not declare', () => {
        const node: DepGraphNode = {
            ...rootNode,
            sourceCode: "import { X } from '@unknown/lib';\nexport class MyButton {}\n",
            imports: []
        };
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([node]), consumerPkg);
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        expect(result.value.dependencies).not.to.have.property('@unknown/lib');
    });

    it('also picks up third-party packages referenced in the snippet itself', () => {
        const tsBlock: ComponentPlaygroundBlock = {
            title: 'Snippet import',
            snippet: "import { thing } from '@my-org/icons';\nconst x = thing();",
            language: 'typescript',
            line: 0
        };
        const pkg = {
            dependencies: {
                '@angular/core': '^21.0.0',
                '@my-org/icons': '^4.0.0'
            }
        };
        const result = buildPlaygroundManifest('MyButton', tsBlock, resolverFor([rootNode]), pkg);
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        expect(result.value.dependencies['@my-org/icons']).to.equal('^4.0.0');
    });

    it('resolves deep imports back to the package root for the lookup', () => {
        const node: DepGraphNode = {
            ...rootNode,
            sourceCode:
                "import { cloneDeep } from 'lodash-es/cloneDeep';\n" +
                "import { Sub } from '@my-org/ui-kit/button';\n" +
                'export class MyButton {}\n',
            imports: []
        };
        const pkg = {
            dependencies: {
                '@angular/core': '^21.0.0',
                'lodash-es': '^4.17.21',
                '@my-org/ui-kit': '^2.0.0'
            }
        };
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([node]), pkg);
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        expect(result.value.dependencies['lodash-es']).to.equal('^4.17.21');
        expect(result.value.dependencies['@my-org/ui-kit']).to.equal('^2.0.0');
    });

    it('does not auto-forward Angular peers as third-party packages (already handled)', () => {
        const node: DepGraphNode = {
            ...rootNode,
            sourceCode: "import { Component } from '@angular/core';\nexport class MyButton {}\n",
            imports: []
        };
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([node]), consumerPkg);
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        // Already pinned via ANGULAR_PEERS at consumer's @angular/core spec.
        expect(result.value.dependencies['@angular/core']).to.equal('^21.0.0');
    });

    it('honours extraDependencies as the final override (wins over consumer-pkg lookup)', () => {
        const node: DepGraphNode = {
            ...rootNode,
            sourceCode: "import { CngxButton } from '@my-org/ui-kit';\nexport class MyButton {}\n",
            imports: []
        };
        const pkg = {
            dependencies: { '@angular/core': '^21.0.0', '@my-org/ui-kit': '^2.5.0' }
        };
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([node]), pkg, {
            extraDependencies: { '@my-org/ui-kit': '^3.0.0-next.1', '@my-org/themes': '*' }
        });
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        // Override beats consumer-declared version.
        expect(result.value.dependencies['@my-org/ui-kit']).to.equal('^3.0.0-next.1');
        // Extra dep with no consumer entry still gets pinned.
        expect(result.value.dependencies['@my-org/themes']).to.equal('*');
    });

    it('emits POSIX paths only — never backslashes (F2)', () => {
        const winPath: DepGraphNode = {
            ...rootNode,
            file: 'src\\app\\my-button.component.ts'
        };
        const result = buildPlaygroundManifest(
            'MyButton',
            block,
            resolverFor([winPath]),
            consumerPkg
        );
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        for (const path of Object.keys(result.value.files)) {
            expect(path).not.to.contain('\\');
        }
    });
});
