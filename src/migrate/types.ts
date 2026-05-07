/**
 * Shared types for the `compodocx migrate` CLI.
 *
 * The converter is split into per-rule emitters, but the public surface
 * is a small set of records that flow through `template`, `templates`,
 * `css`, and `inspect` subcommands.
 */

export type FidelityScore = 'green' | 'yellow' | 'red';

export type WarningKind =
    | 'unknown-helper'
    | 'removed-construct'
    | 'aggressive-rewrite'
    | 'manual-review'
    | 'lossy-rename'
    | 'unsupported-block'
    | 'partial-no-target'
    | 'css-audit-only';

export interface Warning {
    file: string;
    line: number;
    column?: number;
    message: string;
    kind: WarningKind;
}

export interface ConvertResult {
    /** Path to the input `.hbs` file (relative to cwd when possible). */
    file: string;
    /** Generated JavaScript source. Empty string if the converter rejected the input. */
    output: string;
    /** Per-file fidelity score. */
    score: FidelityScore;
    warnings: Warning[];
    /** Set when the input was rejected by a hard limit (e.g. page-level layout). */
    hardLimit?: HardLimitReason;
    /** Resolved override name (e.g. `component`, `block-method`). Null when input is not a recognized override slot. */
    overrideName: string | null;
}

export interface HardLimitReason {
    kind: 'page-layout' | 'unknown-override';
    message: string;
    suggestion: string;
}

export interface CssRewriteResult {
    file: string;
    /** Rewritten file contents. Equal to input when no rules matched. */
    output: string;
    /** Bytes rewritten in the output (number of substitutions applied). */
    rewriteCount: number;
    /** Audit-only matches in non-rewritten files (conservative mode for .ts/.html). */
    auditMatches: AuditMatch[];
    score: FidelityScore;
    warnings: Warning[];
}

export interface AuditMatch {
    file: string;
    line: number;
    column: number;
    from: string;
    to: string;
    snippet: string;
}

export interface InspectFinding {
    kind:
        | 'hbs-migrate-able'
        | 'hbs-hard-limit'
        | 'hbs-unknown-override'
        | 'css-class-rename'
        | 'stale-cli-flag'
        | 'stale-theme-name'
        | 'esm-package'
        | 'unknown';
    severity: 'info' | 'warning' | 'error';
    file: string;
    line?: number;
    message: string;
    suggestion?: string;
}

export interface InspectReport {
    project: string;
    findings: InspectFinding[];
    summary: {
        green: number;
        yellow: number;
        red: number;
    };
    score: FidelityScore;
}

export interface RunSummary {
    files: ConvertResult[];
    summary: {
        green: number;
        yellow: number;
        red: number;
    };
    score: FidelityScore;
}
