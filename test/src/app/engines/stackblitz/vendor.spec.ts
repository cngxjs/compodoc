import {
    pruneVendorClosure,
    resolveVendorPackages,
    type VendorFsReader,
    type VendorPackage,
    vendorClosure
} from '../../../../../src/app/engines/stackblitz/vendor';

/**
 * Build a VendorFsReader from a flat `path -> content` map. Directory
 * existence is inferred from any file living under that prefix; `listFiles`
 * returns every file path under `dir`.
 */
const readerFromMap = (files: Record<string, string>): VendorFsReader => {
    const keys = Object.keys(files);
    return {
        readFile: (p: string): string | null => (p in files ? files[p] : null),
        exists: (p: string): boolean =>
            p in files || keys.some(k => k === p || k.startsWith(`${p}/`)),
        listFiles: (dir: string): string[] => keys.filter(k => k === dir || k.startsWith(`${dir}/`))
    };
};

const pkgJson = (
    name: string,
    deps: Record<string, string> = {},
    peer: Record<string, string> = {}
) => JSON.stringify({ name, version: '1.0.0', dependencies: deps, peerDependencies: peer });

describe('resolveVendorPackages', () => {
    it('returns empty (no error) when no patterns are given', () => {
        const result = resolveVendorPackages([], 'dist', readerFromMap({}));
        expect(result.packages).to.deep.equal({});
        expect(result.errors).to.have.length(0);
    });

    it('errors when the vendor root does not exist', () => {
        const result = resolveVendorPackages(['@cngx/ui'], 'dist', readerFromMap({}));
        expect(result.errors).to.have.length(1);
        expect(result.errors[0]).to.contain('vendor root');
        expect(result.errors[0]).to.contain('build the libraries');
    });

    it('resolves a package by its package.json name regardless of dir layout', () => {
        const files = {
            // dir name (`ui-dist`) deliberately differs from the package name.
            'dist/ui-dist/package.json': pkgJson('@cngx/ui'),
            'dist/ui-dist/fesm2022/cngx-ui.mjs': 'export const x = 1;',
            'dist/ui-dist/index.d.ts': 'export declare const x: number;'
        };
        const result = resolveVendorPackages(['@cngx/ui'], 'dist', readerFromMap(files));
        expect(result.errors).to.have.length(0);
        expect(result.packages).to.have.property('@cngx/ui');
        const pkg = result.packages['@cngx/ui'];
        expect(Object.keys(pkg.files).sort()).to.deep.equal([
            'fesm2022/cngx-ui.mjs',
            'index.d.ts',
            'package.json'
        ]);
        expect(pkg.byteSize).to.be.greaterThan(0);
    });

    it('drops sourcemaps and legacy bundle dirs; byteSize reflects the slim set', () => {
        const files = {
            'dist/ui/package.json': pkgJson('@cngx/ui'),
            'dist/ui/index.d.ts': 'export declare const x: number;',
            'dist/ui/fesm2022/cngx-ui.mjs': 'export const x = 1;',
            'dist/ui/fesm2022/cngx-ui.mjs.map': '{"version":3,"sources":[]}',
            // Legacy / duplicate bundle dirs the WebContainer build never reads.
            'dist/ui/esm2022/cngx-ui.mjs': 'export const x = 1; // dupe',
            'dist/ui/esm2022/cngx-ui.mjs.map': '{}',
            'dist/ui/fesm2020/cngx-ui.mjs': 'old',
            'dist/ui/bundles/cngx-ui.umd.js': 'umd'
        };
        const result = resolveVendorPackages(['@cngx/ui'], 'dist', readerFromMap(files));
        const pkg = result.packages['@cngx/ui'];
        expect(Object.keys(pkg.files).sort()).to.deep.equal([
            'fesm2022/cngx-ui.mjs',
            'index.d.ts',
            'package.json'
        ]);
        // byteSize sums only the kept (slim) files.
        const expected =
            files['dist/ui/package.json'].length +
            files['dist/ui/index.d.ts'].length +
            files['dist/ui/fesm2022/cngx-ui.mjs'].length;
        expect(pkg.byteSize).to.equal(expected);
    });

    it('keeps sourcemaps when includeSourcemaps is set', () => {
        const files = {
            'dist/ui/package.json': pkgJson('@cngx/ui'),
            'dist/ui/fesm2022/cngx-ui.mjs': 'export const x = 1;',
            'dist/ui/fesm2022/cngx-ui.mjs.map': '{"version":3}'
        };
        const result = resolveVendorPackages(['@cngx/ui'], 'dist', readerFromMap(files), {
            includeSourcemaps: true
        });
        expect(result.packages['@cngx/ui'].files).to.have.property('fesm2022/cngx-ui.mjs.map');
    });

    it('keeps secondary-entry-point package.json as files, not separate packages', () => {
        const files = {
            'dist/ui/package.json': pkgJson('@cngx/ui'),
            'dist/ui/fesm2022/cngx-ui.mjs': 'a',
            // Secondary entry point — has its own package.json + name.
            'dist/ui/tabs/package.json': JSON.stringify({ name: '@cngx/ui/tabs' }),
            'dist/ui/tabs/index.d.ts': 'b'
        };
        const result = resolveVendorPackages(['@cngx/ui'], 'dist', readerFromMap(files));
        expect(Object.keys(result.packages)).to.deep.equal(['@cngx/ui']);
        // The secondary entry's files ship under the primary package.
        expect(result.packages['@cngx/ui'].files).to.have.property('tabs/package.json');
        expect(result.packages['@cngx/ui'].files).to.have.property('tabs/index.d.ts');
    });

    it('expands a glob pattern across sibling packages', () => {
        const files = {
            'dist/ui/package.json': pkgJson('@cngx/ui'),
            'dist/ui/a.mjs': '1',
            'dist/common/package.json': pkgJson('@cngx/common'),
            'dist/common/b.mjs': '2',
            'dist/unrelated/package.json': pkgJson('@other/x'),
            'dist/unrelated/c.mjs': '3'
        };
        const result = resolveVendorPackages(['@cngx/*'], 'dist', readerFromMap(files));
        expect(Object.keys(result.packages).sort()).to.deep.equal(['@cngx/common', '@cngx/ui']);
        expect(result.packages).not.to.have.property('@other/x');
    });

    it('errors when an explicitly-named package is absent, warns when a glob misses', () => {
        const files = {
            'dist/ui/package.json': pkgJson('@cngx/ui'),
            'dist/ui/a.mjs': '1'
        };
        const result = resolveVendorPackages(
            ['@cngx/missing', '@nope/*'],
            'dist',
            readerFromMap(files)
        );
        expect(result.errors).to.have.length(1);
        expect(result.errors[0]).to.contain('@cngx/missing');
        expect(result.warnings.some(w => w.includes('@nope/*'))).to.be.true;
    });

    it('records only matching-pattern deps as vendorDeps (registry peers excluded)', () => {
        const files = {
            'dist/ui/package.json': pkgJson(
                '@cngx/ui',
                { '@cngx/common': '1.0.0' },
                { '@angular/core': '^21.0.0', rxjs: '~7.8.0', '@cngx/core': '1.0.0' }
            ),
            'dist/ui/a.mjs': '1',
            'dist/common/package.json': pkgJson('@cngx/common'),
            'dist/common/b.mjs': '2',
            'dist/core/package.json': pkgJson('@cngx/core'),
            'dist/core/c.mjs': '3'
        };
        const result = resolveVendorPackages(['@cngx/*'], 'dist', readerFromMap(files));
        expect(result.packages['@cngx/ui'].vendorDeps.sort()).to.deep.equal([
            '@cngx/common',
            '@cngx/core'
        ]);
        // Registry peers never become vendor edges.
        expect(result.packages['@cngx/ui'].vendorDeps).not.to.contain('@angular/core');
        expect(result.packages['@cngx/ui'].vendorDeps).not.to.contain('rxjs');
    });

    it('skips nested node_modules defensively', () => {
        const files = {
            'dist/ui/package.json': pkgJson('@cngx/ui'),
            'dist/ui/a.mjs': '1',
            'dist/ui/node_modules/evil/package.json': pkgJson('evil'),
            'dist/ui/node_modules/evil/index.js': 'x'
        };
        const result = resolveVendorPackages(['@cngx/*'], 'dist', readerFromMap(files));
        expect(Object.keys(result.packages)).to.deep.equal(['@cngx/ui']);
        expect(result.packages['@cngx/ui'].files).not.to.have.property(
            'node_modules/evil/index.js'
        );
    });
});

describe('vendorClosure', () => {
    const mk = (name: string, vendorDeps: string[]): VendorPackage => ({
        name,
        files: {},
        vendorDeps,
        byteSize: 0
    });

    it('collects the transitive closure from a seed', () => {
        const packages = {
            '@cngx/ui': mk('@cngx/ui', ['@cngx/common', '@cngx/core']),
            '@cngx/common': mk('@cngx/common', ['@cngx/core']),
            '@cngx/core': mk('@cngx/core', []),
            '@cngx/unused': mk('@cngx/unused', [])
        };
        const closure = vendorClosure(['@cngx/ui'], packages).sort();
        expect(closure).to.deep.equal(['@cngx/common', '@cngx/core', '@cngx/ui']);
        expect(closure).not.to.contain('@cngx/unused');
    });

    it('ignores seeds that are not vendored packages', () => {
        const packages = { '@cngx/ui': mk('@cngx/ui', []) };
        const closure = vendorClosure(['@angular/core', '@cngx/ui'], packages);
        expect(closure).to.deep.equal(['@cngx/ui']);
    });

    it('handles cyclic vendor deps without looping', () => {
        const packages = {
            a: mk('a', ['b']),
            b: mk('b', ['a'])
        };
        const closure = vendorClosure(['a'], packages).sort();
        expect(closure).to.deep.equal(['a', 'b']);
    });
});

describe('pruneVendorClosure', () => {
    // Realistic ng-packagr layout: an `exports` map keying each entry point to
    // its FESM chunk + typings. `@cngx/ui/tabs` references a sibling entry
    // (`@cngx/ui/a11y`) and a cross-package entry (`@cngx/common/forms`).
    const uiPkg: VendorPackage = {
        name: '@cngx/ui',
        files: {
            'package.json': JSON.stringify({
                name: '@cngx/ui',
                exports: {
                    '.': { types: './index.d.ts', default: './fesm2022/ui.mjs' },
                    './tabs': { types: './tabs/index.d.ts', default: './fesm2022/ui-tabs.mjs' },
                    './a11y': { types: './a11y/index.d.ts', default: './fesm2022/ui-a11y.mjs' },
                    './unused': {
                        types: './unused/index.d.ts',
                        default: './fesm2022/ui-unused.mjs'
                    }
                }
            }),
            'index.d.ts': 'export {};',
            'fesm2022/ui.mjs': 'export const Ui = 1;',
            'fesm2022/ui-tabs.mjs':
                "import { A11y } from '@cngx/ui/a11y';\n" +
                "import { Forms } from '@cngx/common/forms';\nexport const Tabs = 1;",
            'fesm2022/ui-a11y.mjs': 'export const A11y = 1;',
            'fesm2022/ui-unused.mjs': 'export const Unused = 1;',
            'tabs/index.d.ts': 'export declare const Tabs: number;',
            'a11y/index.d.ts': 'export declare const A11y: number;',
            'unused/index.d.ts': 'export declare const Unused: number;'
        },
        vendorDeps: ['@cngx/common'],
        byteSize: 0
    };

    const commonPkg: VendorPackage = {
        name: '@cngx/common',
        files: {
            'package.json': JSON.stringify({
                name: '@cngx/common',
                exports: {
                    '.': { types: './index.d.ts', default: './fesm2022/common.mjs' },
                    './forms': {
                        types: './forms/index.d.ts',
                        default: './fesm2022/common-forms.mjs'
                    },
                    './other': {
                        types: './other/index.d.ts',
                        default: './fesm2022/common-other.mjs'
                    }
                }
            }),
            'index.d.ts': 'export {};',
            'fesm2022/common.mjs': 'export const C = 1;',
            'fesm2022/common-forms.mjs': 'export const Forms = 1;',
            'fesm2022/common-other.mjs': 'export const Other = 1;',
            'forms/index.d.ts': 'export declare const Forms: number;',
            'other/index.d.ts': 'export declare const Other: number;'
        },
        vendorDeps: [],
        byteSize: 0
    };

    it('keeps the imported entry + transitively-referenced sibling, drops the rest', () => {
        const out = pruneVendorClosure(['@cngx/ui'], { '@cngx/ui': uiPkg }, ['@cngx/ui/tabs']);
        expect(Object.keys(out['@cngx/ui']).sort()).to.deep.equal([
            'a11y/index.d.ts', // reached: ui-tabs imports @cngx/ui/a11y
            'fesm2022/ui-a11y.mjs',
            'fesm2022/ui-tabs.mjs',
            'index.d.ts', // root typings always kept
            'package.json', // root pkg.json (exports map) always kept
            'tabs/index.d.ts'
        ]);
        // Unreached entry and the un-imported root FESM are dropped.
        expect(out['@cngx/ui']).not.to.have.property('fesm2022/ui-unused.mjs');
        expect(out['@cngx/ui']).not.to.have.property('unused/index.d.ts');
        expect(out['@cngx/ui']).not.to.have.property('fesm2022/ui.mjs');
    });

    it('follows cross-package entry-point references', () => {
        const out = pruneVendorClosure(
            ['@cngx/ui', '@cngx/common'],
            { '@cngx/ui': uiPkg, '@cngx/common': commonPkg },
            ['@cngx/ui/tabs']
        );
        // ui-tabs imports @cngx/common/forms → only that entry of common ships.
        expect(Object.keys(out['@cngx/common']).sort()).to.deep.equal([
            'fesm2022/common-forms.mjs',
            'forms/index.d.ts',
            'index.d.ts',
            'package.json'
        ]);
        expect(out['@cngx/common']).not.to.have.property('fesm2022/common-other.mjs');
    });

    it('ships only root files for a closure package nothing references', () => {
        // `@cngx/ui` (root) is imported but its root FESM references no sibling;
        // `@cngx/common` is in the closure via vendorDeps but never reached.
        const out = pruneVendorClosure(
            ['@cngx/ui', '@cngx/common'],
            { '@cngx/ui': uiPkg, '@cngx/common': commonPkg },
            ['@cngx/ui']
        );
        expect(Object.keys(out['@cngx/common']).sort()).to.deep.equal([
            'index.d.ts',
            'package.json'
        ]);
    });

    it('ships the whole package when an imported subpath maps to no entry', () => {
        const out = pruneVendorClosure(['@cngx/ui'], { '@cngx/ui': uiPkg }, [
            '@cngx/ui/tabs/internal'
        ]);
        expect(Object.keys(out['@cngx/ui']).sort()).to.deep.equal(Object.keys(uiPkg.files).sort());
    });

    it('ships the whole package when there is no exports map to read', () => {
        const noExports: VendorPackage = {
            name: '@cngx/x',
            files: {
                'package.json': '{"name":"@cngx/x"}',
                'fesm2022/x.mjs': 'export const X = 1;',
                'y/index.d.ts': 'export declare const Y: number;'
            },
            vendorDeps: [],
            byteSize: 0
        };
        const out = pruneVendorClosure(['@cngx/x'], { '@cngx/x': noExports }, ['@cngx/x']);
        expect(Object.keys(out['@cngx/x']).sort()).to.deep.equal([
            'fesm2022/x.mjs',
            'package.json',
            'y/index.d.ts'
        ]);
    });
});
