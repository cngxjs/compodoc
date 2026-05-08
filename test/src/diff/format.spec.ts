import { describe, expect, it } from 'vitest';
import { renderJson } from '../../../src/diff/format/json';
import { renderMarkdown } from '../../../src/diff/format/markdown';
import type { DiffResult } from '../../../src/diff/types';

const sampleResult: DiffResult = {
    schemaVersion: 1,
    comparedAt: '2026-05-07T15:00:00.000Z',
    from: { generatedAt: '2026-04-01T00:00:00.000Z', compodocxVersion: '0.2.0' },
    to: { generatedAt: '2026-05-07T00:00:00.000Z', compodocxVersion: '0.3.0' },
    summary: { breaking: 1, additive: 1, docsOnly: 1, unchanged: 47 },
    changes: [
        {
            kind: 'component-removed',
            entity: 'component',
            name: 'FooComponent',
            file: 'src/foo.component.ts',
            severity: 'breaking',
            changes: []
        },
        {
            kind: 'component-added',
            entity: 'component',
            name: 'BazComponent',
            file: 'src/baz.component.ts',
            severity: 'additive',
            changes: []
        },
        {
            kind: 'pipe-changed',
            entity: 'pipe',
            name: 'FormatDate',
            file: 'src/format-date.pipe.ts',
            severity: 'docs-only',
            changes: [
                {
                    field: 'description',
                    kind: 'value-changed',
                    oldValue: 'old',
                    newValue: 'new'
                }
            ]
        }
    ]
};

describe('diff/format/json', () => {
    it('emits valid parseable JSON', () => {
        const out = renderJson(sampleResult);
        expect(() => JSON.parse(out)).not.toThrow();
    });

    it('round-trips the DiffResult shape', () => {
        const out = renderJson(sampleResult);
        const parsed = JSON.parse(out);
        expect(parsed.schemaVersion).toBe(1);
        expect(parsed.summary).toEqual({
            breaking: 1,
            additive: 1,
            docsOnly: 1,
            unchanged: 47
        });
        expect(parsed.changes).toHaveLength(3);
    });
});

describe('diff/format/markdown', () => {
    it('renders the from→to heading using compodocxVersion', () => {
        const out = renderMarkdown(sampleResult);
        expect(out).toMatch(/## API changes — 0\.2\.0 → 0\.3\.0/);
    });

    it('groups by severity with counts', () => {
        const out = renderMarkdown(sampleResult);
        expect(out).toMatch(/### Breaking changes \(1\)/);
        expect(out).toMatch(/### Additive \(1\)/);
        expect(out).toMatch(/### Documentation \(1\)/);
    });

    it('emits a changelog-shaped line per change', () => {
        const out = renderMarkdown(sampleResult);
        expect(out).toMatch(/- \*\*`FooComponent`\*\* removed/);
        expect(out).toMatch(/- \*\*`BazComponent`\*\* added/);
        expect(out).toMatch(/- `FormatDate` description updated/);
    });

    it('drops empty severity sections', () => {
        const empty: DiffResult = {
            ...sampleResult,
            summary: { breaking: 0, additive: 0, docsOnly: 1, unchanged: 47 },
            changes: [sampleResult.changes[2]]
        };
        const out = renderMarkdown(empty);
        expect(out).not.toMatch(/Breaking changes/);
        expect(out).not.toMatch(/### Additive/);
        expect(out).toMatch(/### Documentation \(1\)/);
    });

    it('emits a "no changes detected" line when the summary is empty', () => {
        const empty: DiffResult = {
            ...sampleResult,
            summary: { breaking: 0, additive: 0, docsOnly: 0, unchanged: 100 },
            changes: []
        };
        const out = renderMarkdown(empty);
        expect(out).toMatch(/No changes detected/);
    });
});
