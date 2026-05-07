import * as fs from 'node:fs';
import * as path from 'node:path';
import { rewriteCss } from '../../../src/migrate/css';

const FIXTURE_ROOT = path.resolve(__dirname, '../../fixtures/migrate-fixtures/css');
const SAMPLE_SCSS = path.join(FIXTURE_ROOT, 'sample.scss');
const SAMPLE_HTML = path.join(FIXTURE_ROOT, 'sample.html');

describe('migrate/css — conservative mode', () => {
    it('rewrites Bootstrap classes in .scss', () => {
        const source = fs.readFileSync(SAMPLE_SCSS, 'utf8');
        const result = rewriteCss(SAMPLE_SCSS, source, 'conservative');
        expect(result.output).toContain('.cdx-member-card');
        expect(result.output).toContain('.cdx-member-body');
        expect(result.output).toContain('.cdx-tab-bar');
        expect(result.output).toContain('.cdx-tab');
        expect(result.rewriteCount).toBeGreaterThan(0);
    });

    it('rewrites prefix classes (compodoc-* → cdx-*) in .scss', () => {
        const source = fs.readFileSync(SAMPLE_SCSS, 'utf8');
        const result = rewriteCss(SAMPLE_SCSS, source, 'conservative');
        expect(result.output).toContain('.cdx-icon-search');
    });

    it('preserves data-compodoc selectors in .scss (never-touch)', () => {
        const source = fs.readFileSync(SAMPLE_SCSS, 'utf8');
        const result = rewriteCss(SAMPLE_SCSS, source, 'conservative');
        expect(result.output).toContain('[data-compodoc="block-providers"]');
    });

    it('emits audit warnings without rewriting context-dependent classes', () => {
        const source = fs.readFileSync(SAMPLE_SCSS, 'utf8');
        const result = rewriteCss(SAMPLE_SCSS, source, 'conservative');
        expect(result.output).toContain('.menu');
        expect(result.warnings.some(w => w.message.includes('.menu'))).toBe(true);
    });

    it('does NOT rewrite .html in conservative mode (audit-only)', () => {
        const source = fs.readFileSync(SAMPLE_HTML, 'utf8');
        const result = rewriteCss(SAMPLE_HTML, source, 'conservative');
        expect(result.output).toBe(source);
        expect(result.rewriteCount).toBe(0);
        expect(result.warnings.some(w => w.kind === 'css-audit-only')).toBe(true);
    });
});

describe('migrate/css — aggressive mode', () => {
    it('rewrites class attributes in .html', () => {
        const source = fs.readFileSync(SAMPLE_HTML, 'utf8');
        const result = rewriteCss(SAMPLE_HTML, source, 'aggressive');
        expect(result.output).toContain('class="cdx-member-card cdx-member-body"');
        expect(result.output).toContain('class="cdx-tab-bar"');
    });

    it('preserves data-compodoc attributes in .html (never-touch)', () => {
        const source = fs.readFileSync(SAMPLE_HTML, 'utf8');
        const result = rewriteCss(SAMPLE_HTML, source, 'aggressive');
        // The attribute itself survives — rewriter must NOT touch lines containing
        // data-compodoc to avoid corrupting the attribute name or value.
        expect(result.output).toContain('data-compodoc="block-providers"');
        // The class on the data-compodoc element is also preserved unchanged
        // (rewriter skips the whole tag rather than just the attribute).
        expect(result.output).toContain('data-compodoc="block-providers" class="card"');
    });

    it('emits aggressive-rewrite warning on every markup file', () => {
        const source = fs.readFileSync(SAMPLE_HTML, 'utf8');
        const result = rewriteCss(SAMPLE_HTML, source, 'aggressive');
        expect(result.warnings.some(w => w.kind === 'aggressive-rewrite')).toBe(true);
    });
});

describe('migrate/css — data-compodoc never-touch (negative test)', () => {
    it('survives BOTH conservative and aggressive modes', () => {
        const html = '<div data-compodoc="block-providers" class="card">x</div>';
        const conservative = rewriteCss('/x.html', html, 'conservative');
        const aggressive = rewriteCss('/x.html', html, 'aggressive');
        expect(conservative.output).toContain('data-compodoc="block-providers"');
        expect(aggressive.output).toContain('data-compodoc="block-providers"');
    });
});
