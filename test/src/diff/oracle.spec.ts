import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExportData } from '../../../src/app/interfaces/export-data.interface';
import { classifyAll, summarize } from '../../../src/diff/classify';
import { compare } from '../../../src/diff/compare';

/**
 * Fidelity oracle (F6). Hand-crafted v1/v2 snapshots in
 * test/fixtures/diff-fixtures/ exercise one of each change kind: entity
 * removed, entity added, required-input added, input removed, input type
 * changed, public method added, theme token added, description changed.
 *
 * The oracle asserts the SHAPE of the classified output (per-name severity
 * and the summary counts) — it is the cheapest way to catch a regression
 * in either the compare engine or the classifier without driving the CLI.
 */

const FIXTURE_DIR = path.resolve(__dirname, '../../fixtures/diff-fixtures');

const readJson = (file: string): ExportData =>
    JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, file), 'utf8'));

describe('diff/oracle — fidelity against hand-crafted v1/v2', () => {
    const v1 = readJson('v1.json');
    const v2 = readJson('v2.json');
    const { changes, unchanged } = compare(v1, v2);
    const classified = classifyAll(changes);
    const summary = summarize(classified, unchanged);
    const byName = new Map(classified.map(c => [c.name, c]));

    it('FooComponent shows up as changed with breaking severity', () => {
        const change = byName.get('FooComponent');
        expect(change?.kind).toBe('component-changed');
        expect(change?.severity).toBe('breaking');
    });

    it('RemovedComponent shows up as removed (breaking)', () => {
        const change = byName.get('RemovedComponent');
        expect(change?.kind).toBe('component-removed');
        expect(change?.severity).toBe('breaking');
    });

    it('BazComponent shows up as added (additive)', () => {
        const change = byName.get('BazComponent');
        expect(change?.kind).toBe('component-added');
        expect(change?.severity).toBe('additive');
    });

    it('FormatDate pipe shows up as changed (docs-only)', () => {
        const change = byName.get('FormatDate');
        expect(change?.kind).toBe('pipe-changed');
        expect(change?.severity).toBe('docs-only');
    });

    it('BarComponent does not appear in changes (unchanged)', () => {
        expect(byName.has('BarComponent')).toBe(false);
    });

    it('summary counts match the hand-crafted spec', () => {
        // 2 breaking (FooComponent changed, RemovedComponent removed)
        // 1 additive (BazComponent added)
        // 1 docs-only (FormatDate description)
        // 1 unchanged (BarComponent)
        expect(summary).toEqual({
            breaking: 2,
            additive: 1,
            docsOnly: 1,
            unchanged: 1
        });
    });
});
