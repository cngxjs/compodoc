import * as fs from 'node:fs';
import * as path from 'node:path';
import { convertTemplate } from '../../../src/migrate/template';

const FIXTURE_ROOT = path.resolve(__dirname, '../../fixtures/migrate-fixtures/hbs');
const PAGE_HBS = path.resolve(__dirname, '../../fixtures/test-templates/page.hbs');

const loadFixture = (name: string) => {
    const file = path.join(FIXTURE_ROOT, name);
    return { file, source: fs.readFileSync(file, 'utf8') };
};

describe('migrate/template — round-trip', () => {
    it('converts component.hbs into a runnable JS module', () => {
        const result = convertTemplate(loadFixture('component.hbs'));
        expect(result.hardLimit).toBeUndefined();
        expect(result.overrideName).toBe('component');
        expect(result.output).toContain('module.exports = function (data, helpers)');
        expect(result.output).toContain('helpers.parseDescription');
        expect(result.output).toContain('helpers.linkTypeHtml');
        // The output evaluates to a function that returns a non-empty string
        // when called with mock data + helper stubs.
        const factory = new Function('module', `${result.output}; return module.exports;`);
        const stubModule = { exports: () => '' as any };
        const fn = factory(stubModule);
        const html = fn(
            {
                component: {
                    name: 'Foo',
                    description: 'desc',
                    selector: 'app-foo',
                    methodsClass: [{ name: 'doThing', returnType: 'void' }]
                },
                depth: 0
            },
            {
                parseDescription: (s: string) => `<p>${s}</p>`,
                linkTypeHtml: (s: string) => `<a>${s}</a>`,
                t: (s: string) => s
            }
        );
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
        expect(html).toContain('Foo');
        expect(html).toContain('doThing');
    });

    it('converts block-method.hbs and preserves data-compodoc attribute', () => {
        const result = convertTemplate(loadFixture('block-method.hbs'));
        expect(result.hardLimit).toBeUndefined();
        expect(result.overrideName).toBe('block-method');
        // data-compodoc is intentionally preserved (CLAUDE.md never-touch rule).
        expect(result.output).toContain('data-compodoc="block-method"');
    });
});

describe('migrate/template — hard limits', () => {
    it('rejects page.hbs with a layout-not-overridable error', () => {
        const result = convertTemplate({
            file: PAGE_HBS,
            source: fs.readFileSync(PAGE_HBS, 'utf8')
        });
        expect(result.hardLimit).toBeDefined();
        expect(result.hardLimit?.kind).toBe('page-layout');
        expect(result.output).toBe('');
        expect(result.score).toBe('red');
        expect(result.hardLimit?.suggestion).toMatch(/extTheme|gaID|includes/);
    });

    it('rejects override names not in CONTEXT_TEMPLATE_MAP / wired blocks', () => {
        const result = convertTemplate(loadFixture('unknown-name.hbs'));
        expect(result.hardLimit).toBeDefined();
        expect(result.hardLimit?.kind).toBe('unknown-override');
        expect(result.output).toBe('');
        expect(result.score).toBe('red');
        expect(result.overrideName).toBe(null);
    });

    it('detects DOCTYPE-html input even when filename does not match', () => {
        const result = convertTemplate({
            file: '/tmp/looks-like-page.hbs',
            source: '<!doctype html><html><body>{{title}}</body></html>',
            overrideName: 'component' // would otherwise be valid
        });
        expect(result.hardLimit?.kind).toBe('page-layout');
    });
});
