import {
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
