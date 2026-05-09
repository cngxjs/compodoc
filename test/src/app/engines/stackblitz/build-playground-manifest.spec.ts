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
    it('returns the minimal manifest shape for a single-component playground', () => {
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
        expect(result.value.files['src/main.ts']).to.contain('bootstrapApplication');
        expect(result.value.files['src/app/demo.component.ts']).to.contain('DemoComponent');
        expect(result.value.files['src/index.html']).to.contain('<cdx-demo>');
        expect(result.value.files['angular.json']).to.contain('@angular/cli');
        expect(result.value.files['tsconfig.json']).to.contain('ES2022');
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

    it('falls back to "*" when the consumer package.json omits an Angular peer', () => {
        const result = buildPlaygroundManifest('MyButton', block, resolverFor([rootNode]), {});
        expect(result.ok).to.be.true;
        if (!result.ok) {
            return;
        }
        expect(result.value.dependencies['@angular/core']).to.equal('*');
        expect(result.value.dependencies['@angular/common']).to.equal('*');
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
        const demo = result.value.files['src/app/demo.component.ts'];
        expect(demo).to.contain('<pre><code>const x = 1;</code></pre>');
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
