import * as path from 'node:path';
import { realFs } from '../../../src/migrate/fs-adapter';
import { inspectProject } from '../../../src/migrate/inspect';

const PROJECT_ROOT = path.resolve(__dirname, '../../fixtures/migrate-fixtures/inspect');

describe('migrate/inspect — fixture project', () => {
    const report = inspectProject(PROJECT_ROOT, realFs());
    const findingsBy = (kind: string) => report.findings.filter(f => f.kind === kind);

    it('reports the project root path', () => {
        expect(report.project).toBe(PROJECT_ROOT);
    });

    it('flags page.hbs as a hard-limit', () => {
        const hardLimit = findingsBy('hbs-hard-limit');
        expect(hardLimit).toHaveLength(1);
        expect(hardLimit[0].file).toMatch(/page\.hbs$/);
        expect(hardLimit[0].severity).toBe('error');
    });

    it('flags unknown override names', () => {
        const unknown = findingsBy('hbs-unknown-override');
        expect(unknown).toHaveLength(1);
        expect(unknown[0].file).toMatch(/unknown-name\.hbs$/);
        expect(unknown[0].severity).toBe('error');
    });

    it('lists migrate-able .hbs files (component, block-method)', () => {
        const migrateAble = findingsBy('hbs-migrate-able')
            .map(f => path.basename(f.file))
            .sort();
        expect(migrateAble).toEqual(['block-method.hbs', 'component.hbs']);
    });

    it('reports CSS class rename matches', () => {
        const cssFindings = findingsBy('css-class-rename');
        expect(cssFindings.length).toBeGreaterThan(0);
        expect(cssFindings[0].file).toMatch(/main\.scss$/);
    });

    it('flags ESM "type": "module" in package.json', () => {
        const esm = findingsBy('esm-package');
        expect(esm).toHaveLength(1);
        expect(esm[0].suggestion).toMatch(/\.cjs/);
    });

    it('flags stale CLI flags from .compodocrc.json (gaSite removed in compodocx)', () => {
        const staleFlags = findingsBy('stale-cli-flag');
        expect(staleFlags).toHaveLength(1);
        expect(staleFlags[0].message).toContain('gaSite');
        expect(staleFlags[0].suggestion).toMatch(/--gaID/);
        expect(staleFlags[0].severity).toBe('error');
    });

    it('flags stale theme names from .compodocrc.json (postmark not bundled)', () => {
        const staleThemes = findingsBy('stale-theme-name');
        expect(staleThemes).toHaveLength(1);
        expect(staleThemes[0].message).toContain('postmark');
        expect(staleThemes[0].suggestion).toMatch(/nord/);
        expect(staleThemes[0].severity).toBe('warning');
    });

    it('returns red overall score because page.hbs is rejected', () => {
        expect(report.score).toBe('red');
    });

    it('summary count keys are exhaustive', () => {
        const total = report.summary.green + report.summary.yellow + report.summary.red;
        expect(total).toBe(report.findings.length);
    });
});
