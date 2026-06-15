import {
    extractImports,
    type PackageReader,
    validateImports
} from '../../../../../src/app/engines/stackblitz/import-analysis';

describe('extractImports', () => {
    it('captures named bindings using the original (pre-alias) export name', () => {
        const src = "import { CngxTabNav, MatThing as Local } from '@cngx/ui/tabs';";
        const result = extractImports(src);
        expect(result).to.have.length(1);
        expect(result[0].specifier).to.equal('@cngx/ui/tabs');
        expect(result[0].names.sort()).to.deep.equal(['CngxTabNav', 'MatThing']);
    });

    it('records a default import as `default` and skips namespace/side-effect', () => {
        const src = [
            "import Thing from '@cngx/core';",
            "import * as ns from '@cngx/util';",
            "import '@cngx/polyfill';"
        ].join('\n');
        const bySpec = Object.fromEntries(extractImports(src).map(i => [i.specifier, i.names]));
        expect(bySpec['@cngx/core']).to.deep.equal(['default']);
        expect(bySpec['@cngx/util']).to.deep.equal([]);
        expect(bySpec['@cngx/polyfill']).to.deep.equal([]);
    });

    it('ignores relative imports (they ship inlined, not from the registry)', () => {
        const src = "import { A } from './local';\nimport { B } from '@cngx/ui';";
        const specs = extractImports(src).map(i => i.specifier);
        expect(specs).to.deep.equal(['@cngx/ui']);
    });

    it('merges names across multiple imports of the same specifier', () => {
        const src = "import { A } from '@cngx/ui';\nexport { B } from '@cngx/ui';";
        const result = extractImports(src);
        expect(result).to.have.length(1);
        expect(result[0].names.sort()).to.deep.equal(['A', 'B']);
    });
});

const readerFrom = (
    pkgs: Record<string, { json: object; files?: Record<string, string> }>
): PackageReader => ({
    hasPackage: (root: string): boolean => root in pkgs,
    readPackageJson: (root: string) => (root in pkgs ? (pkgs[root].json as never) : null),
    readPackageFile: (root: string, rel: string): string | null => pkgs[root]?.files?.[rel] ?? null
});

describe('validateImports', () => {
    const empty = new Set<string>();

    it('flags a subpath the pinned version does not export', () => {
        const reader = readerFrom({
            '@cngx/ui': { json: { version: '1.0.0', exports: { '.': './index.mjs' } } }
        });
        const issues = validateImports(
            extractImports("import { Tabs } from '@cngx/ui/tabs';"),
            reader,
            empty
        );
        expect(issues).to.have.length(1);
        expect(issues[0].kind).to.equal('missing-subpath');
        expect(issues[0].message).to.contain('1.0.0');
    });

    it('passes a subpath present in the exports map', () => {
        const reader = readerFrom({
            '@cngx/ui': {
                json: {
                    version: '2.0.0',
                    exports: { '.': './index.mjs', './tabs': { types: './tabs/index.d.ts' } }
                },
                files: { 'tabs/index.d.ts': 'export declare class CngxTabNav {}' }
            }
        });
        const issues = validateImports(
            extractImports("import { CngxTabNav } from '@cngx/ui/tabs';"),
            reader,
            empty
        );
        expect(issues).to.have.length(0);
    });

    it('flags a symbol absent from the entry typings', () => {
        const reader = readerFrom({
            '@cngx/ui': {
                json: { version: '1.2.0', exports: { '.': { types: './index.d.ts' } } },
                files: { 'index.d.ts': 'export declare class CngxButton {}' }
            }
        });
        const issues = validateImports(
            extractImports("import { CngxTabNav } from '@cngx/ui';"),
            reader,
            empty
        );
        expect(issues).to.have.length(1);
        expect(issues[0].kind).to.equal('missing-symbol');
        expect(issues[0].symbol).to.equal('CngxTabNav');
    });

    it('does NOT flag a symbol when typings re-export via wildcard (indeterminate)', () => {
        const reader = readerFrom({
            '@cngx/ui': {
                json: { version: '1.0.0', exports: { '.': { types: './index.d.ts' } } },
                files: { 'index.d.ts': "export * from './internal';" }
            }
        });
        const issues = validateImports(
            extractImports("import { Anything } from '@cngx/ui';"),
            reader,
            empty
        );
        expect(issues).to.have.length(0);
    });

    it('skips packages in the skip set (Angular peers, vendored file: deps)', () => {
        const reader = readerFrom({
            '@cngx/ui': { json: { version: '1.0.0', exports: { '.': './index.mjs' } } }
        });
        const skip = new Set(['@cngx/ui']);
        const issues = validateImports(
            extractImports("import { X } from '@cngx/ui/tabs';"),
            reader,
            skip
        );
        expect(issues).to.have.length(0);
    });

    it('skips packages not installed in node_modules (cannot validate)', () => {
        const reader = readerFrom({});
        const issues = validateImports(
            extractImports("import { X } from '@cngx/ghost';"),
            reader,
            empty
        );
        expect(issues).to.have.length(0);
    });

    it('does not run the subpath check for legacy packages without an exports map', () => {
        const reader = readerFrom({
            'legacy-lib': { json: { version: '0.9.0', main: './index.js' } }
        });
        const issues = validateImports(
            extractImports("import { Whatever } from 'legacy-lib/deep/path';"),
            reader,
            empty
        );
        expect(issues).to.have.length(0);
    });
});
