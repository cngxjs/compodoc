/**
 * Parser + schemaVersion gate for the `compodocx diff` CLI.
 *
 * Reads a `documentation.json` file from disk, validates the JSON shape, and
 * confirms the snapshot was produced by a compodocx ≥ 0.3.0 release (i.e. has
 * a numeric `schemaVersion` field). Pre-v0.3.0 outputs are unversioned —
 * those need re-exporting before the diff can run.
 *
 * The gate is intentionally strict: comparing across schema versions silently
 * produces nonsense (renamed fields show as removed-then-added, etc.), so we
 * fail fast with a clear actionable message.
 */

import * as fs from 'node:fs';
import { EXPORT_SCHEMA_VERSION, type ExportData } from '../app/interfaces/export-data.interface';
import type { ParsedExport, ParseResult } from './types';

/** Read + JSON-parse + schemaVersion-gate a single export file. */
export const parseExportFile = (file: string): ParseResult<ParsedExport> => {
    if (!fs.existsSync(file)) {
        return { ok: false, message: `diff: file not found: ${file}` };
    }
    let raw: string;
    try {
        raw = fs.readFileSync(file, 'utf8');
    } catch (err) {
        return {
            ok: false,
            message: `diff: failed to read ${file}: ${(err as Error).message}`
        };
    }
    return parseExportSource(raw, file);
};

/**
 * Same gate, but reads from a pre-loaded JSON string. Useful for tests and
 * for piping (`cat ... | compodocx diff ...` — out of scope for v0.3.0 but
 * the seam is here).
 */
export const parseExportSource = (raw: string, label: string): ParseResult<ParsedExport> => {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        return {
            ok: false,
            message: `diff: ${label} is not valid JSON: ${(err as Error).message}`
        };
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {
            ok: false,
            message: `diff: ${label} is not a JSON object`
        };
    }
    const obj = parsed as Record<string, unknown>;
    const version = obj.schemaVersion;
    if (typeof version !== 'number') {
        return {
            ok: false,
            message: `diff: ${label} has no schemaVersion — re-export with compodocx ≥ 0.3.0`
        };
    }
    if (version !== EXPORT_SCHEMA_VERSION) {
        if (version > EXPORT_SCHEMA_VERSION) {
            return {
                ok: false,
                message: `diff: ${label} was produced by a newer compodocx (schemaVersion ${version}, this CLI supports ${EXPORT_SCHEMA_VERSION}) — upgrade compodocx to read it`
            };
        }
        return {
            ok: false,
            message: `diff: ${label} schemaVersion ${version} does not match supported ${EXPORT_SCHEMA_VERSION} — re-export with compodocx ≥ 0.3.0`
        };
    }
    return {
        ok: true,
        value: { schemaVersion: version, data: obj as unknown as ExportData }
    };
};

/**
 * Dual-file gate. Errors aggregate so the caller can surface both at once
 * instead of bailing on the first miss.
 */
export const parseDiffInputs = (
    oldFile: string,
    newFile: string
): ParseResult<{ from: ParsedExport; to: ParsedExport }> => {
    const oldResult = parseExportFile(oldFile);
    if (oldResult.ok === false) {
        return { ok: false, message: oldResult.message };
    }
    const newResult = parseExportFile(newFile);
    if (newResult.ok === false) {
        return { ok: false, message: newResult.message };
    }
    return {
        ok: true,
        value: { from: oldResult.value, to: newResult.value }
    };
};
