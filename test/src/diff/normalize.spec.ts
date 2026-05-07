import { describe, expect, it } from 'vitest';
import {
    EXPORT_SCHEMA_VERSION,
    type ExportData,
    VOLATILE_EXPORT_FIELDS
} from '../../../src/app/interfaces/export-data.interface';
import { stripVolatileFields } from '../../../src/diff/normalize';

/**
 * The byte-equal compare path MUST iterate VOLATILE_EXPORT_FIELDS — never
 * duplicate the field list in the comparator (F16). This spec confirms the
 * stripper drops every entry from the constant and leaves the rest of the
 * shape intact.
 */

describe('diff/normalize — stripVolatileFields', () => {
    const sample: ExportData = {
        schemaVersion: EXPORT_SCHEMA_VERSION,
        generatedAt: '2026-05-07T00:00:00.000Z',
        compodocxVersion: '0.3.0',
        components: [{ name: 'Foo' }]
    };

    it('iterates VOLATILE_EXPORT_FIELDS and drops every entry', () => {
        const stripped = stripVolatileFields(sample) as Record<string, unknown>;
        for (const field of VOLATILE_EXPORT_FIELDS) {
            expect(stripped).not.toHaveProperty(field);
        }
    });

    it('preserves non-volatile fields unchanged', () => {
        const stripped = stripVolatileFields(sample) as Record<string, unknown>;
        expect(stripped.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
        expect(stripped.components).toEqual([{ name: 'Foo' }]);
    });

    it('does not mutate the input', () => {
        const before = JSON.parse(JSON.stringify(sample));
        stripVolatileFields(sample);
        expect(sample).toEqual(before);
    });

    it('VOLATILE_EXPORT_FIELDS is non-empty (sanity)', () => {
        expect(VOLATILE_EXPORT_FIELDS.length).toBeGreaterThan(0);
    });
});
