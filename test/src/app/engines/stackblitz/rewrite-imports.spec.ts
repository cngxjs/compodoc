import {
    rewriteDecoratorUrls,
    rewriteRelativeImports
} from '../../../../../src/app/engines/stackblitz/rewrite-imports';

describe('rewriteRelativeImports', () => {
    it('flattens parent-relative paths to ./basename', () => {
        const out = rewriteRelativeImports("import { x } from '../shared/util';");
        expect(out).to.equal("import { x } from './util';");
    });

    it('rewrites sibling-relative paths through the same flattener', () => {
        const out = rewriteRelativeImports("import { Foo } from './foo/bar';");
        expect(out).to.equal("import { Foo } from './bar';");
    });

    it("strips trailing .ts so the bundler's resolver works", () => {
        const out = rewriteRelativeImports("import './sibling.ts';");
        expect(out).to.equal("import './sibling';");
    });

    it('strips trailing .tsx the same way', () => {
        const out = rewriteRelativeImports("import { X } from './widget.tsx';");
        expect(out).to.equal("import { X } from './widget';");
    });

    it('keeps unscoped bare specifiers untouched', () => {
        const out = rewriteRelativeImports("import { Component } from '@angular/core';");
        expect(out).to.equal("import { Component } from '@angular/core';");
    });

    it('keeps deep paths inside packages untouched', () => {
        const out = rewriteRelativeImports("import x from 'lodash-es/cloneDeep';");
        expect(out).to.equal("import x from 'lodash-es/cloneDeep';");
    });

    it('rewrites side-effect imports', () => {
        const out = rewriteRelativeImports("import '../polyfill';");
        expect(out).to.equal("import './polyfill';");
    });

    it('rewrites re-exports through the from clause', () => {
        const out = rewriteRelativeImports("export * from '../shared/types';");
        expect(out).to.equal("export * from './types';");
    });

    it('preserves non-typescript extensions like .module', () => {
        const out = rewriteRelativeImports("import { X } from '../shared/foo.module';");
        expect(out).to.equal("import { X } from './foo.module';");
    });

    it('handles mixed quotes', () => {
        const out = rewriteRelativeImports('import { x } from "../shared/util";');
        expect(out).to.equal('import { x } from "./util";');
    });
});

describe('rewriteDecoratorUrls', () => {
    it('rewrites templateUrl to flat basename', () => {
        const out = rewriteDecoratorUrls("templateUrl: '../templates/main.html'");
        expect(out).to.equal("templateUrl: './main.html'");
    });

    it('rewrites styleUrl (Angular 18+ singular form)', () => {
        const out = rewriteDecoratorUrls("styleUrl: '../theme/dark.css'");
        expect(out).to.equal("styleUrl: './dark.css'");
    });

    it('rewrites every entry inside styleUrls array', () => {
        const out = rewriteDecoratorUrls("styleUrls: ['../a/x.css', '../b/y.css']");
        expect(out).to.equal("styleUrls: ['./x.css', './y.css']");
    });

    it('leaves already-flat urls unchanged in shape', () => {
        const out = rewriteDecoratorUrls("templateUrl: './main.html'");
        expect(out).to.equal("templateUrl: './main.html'");
    });

    it('does not touch unrelated decorator fields', () => {
        const out = rewriteDecoratorUrls("selector: 'app-root'");
        expect(out).to.equal("selector: 'app-root'");
    });
});
