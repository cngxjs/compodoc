import type { ExtractedManifest } from './extract';

/**
 * Compile each extracted playground (`npm install` + `npm run build`) and
 * aggregate a pass/fail summary. The process spawning and filesystem writes
 * come through injected ports so the orchestration is unit-testable without
 * touching npm or the network; the CLI wires the real implementations.
 */

export interface RunOutcome {
    ok: boolean;
    /** Process exit code (0 = success). */
    code: number;
    /** Combined stdout+stderr, used for the failure detail tail. */
    output: string;
}

/** Runs the two build phases inside a materialized project directory. */
export interface BuildRunner {
    install(dir: string): RunOutcome;
    build(dir: string): RunOutcome;
}

/**
 * Writes a manifest's file map to disk and returns the project directory.
 * Injected so tests can stub it; the CLI writes into a temp dir.
 */
export type Materializer = (entry: ExtractedManifest) => string;

export type ValidationStatus = 'pass' | 'fail';

export interface ValidationResult {
    id: string;
    title: string;
    sourceFile?: string;
    status: ValidationStatus;
    /** Phase that failed, when `status === 'fail'`. */
    phase?: 'install' | 'build';
    /** Tail of the failing process output. */
    detail?: string;
}

export interface ValidateDeps {
    materialize: Materializer;
    runner: BuildRunner;
    /** Optional progress callback (one call as each playground starts). */
    onStart?: (entry: ExtractedManifest, index: number, total: number) => void;
}

const tail = (text: string, lines = 20): string => text.split('\n').slice(-lines).join('\n').trim();

/** Validate one materialized playground through install → build. */
export function validateOne(entry: ExtractedManifest, deps: ValidateDeps): ValidationResult {
    const base: ValidationResult = {
        id: entry.id,
        title: entry.manifest.title,
        sourceFile: entry.sourceFile,
        status: 'pass'
    };
    let dir: string;
    try {
        dir = deps.materialize(entry);
    } catch (err) {
        return {
            ...base,
            status: 'fail',
            phase: 'install',
            detail: `could not materialize project: ${(err as Error).message}`
        };
    }

    const install = deps.runner.install(dir);
    if (!install.ok) {
        return { ...base, status: 'fail', phase: 'install', detail: tail(install.output) };
    }
    const build = deps.runner.build(dir);
    if (!build.ok) {
        return { ...base, status: 'fail', phase: 'build', detail: tail(build.output) };
    }
    return base;
}

/** Validate every playground in order. */
export function validateAll(entries: ExtractedManifest[], deps: ValidateDeps): ValidationResult[] {
    const results: ValidationResult[] = [];
    for (let i = 0; i < entries.length; i++) {
        deps.onStart?.(entries[i], i, entries.length);
        results.push(validateOne(entries[i], deps));
    }
    return results;
}

/** `0` when every playground passed, `1` when any failed (CI gate). */
export function exitCodeFromResults(results: ValidationResult[]): number {
    return results.some(r => r.status === 'fail') ? 1 : 0;
}

/** Human-readable summary: one line per playground plus a tally + failure tails. */
export function formatSummary(results: ValidationResult[]): string {
    if (results.length === 0) {
        return 'playground:validate — no @playground manifests found.';
    }
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.length - passed;
    const lines: string[] = [];
    for (const r of results) {
        const mark = r.status === 'pass' ? 'PASS' : 'FAIL';
        const where = r.sourceFile ? ` (${r.sourceFile})` : '';
        const phase = r.status === 'fail' ? ` [${r.phase}]` : '';
        lines.push(`  ${mark} ${r.title}${where}${phase}`);
    }
    lines.push('');
    lines.push(`${results.length} playground(s): ${passed} passed, ${failed} failed.`);
    for (const r of results) {
        if (r.status === 'fail' && r.detail) {
            lines.push('');
            lines.push(`--- ${r.title} [${r.phase}] ---`);
            lines.push(r.detail);
        }
    }
    return lines.join('\n');
}
