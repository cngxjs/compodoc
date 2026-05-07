/**
 * `compodocx migrate inspect <project-path>` — audit-only project scanner.
 *
 * Walks a compodoc project directory and surfaces:
 *  - .hbs files: classified as migrate-able vs hard-limit (page.hbs / unknown).
 *  - CSS class-name matches against the rename rules.
 *  - ESM-package corner case: `"type": "module"` blocks the .js loader's
 *    require() call, so converted overrides need a `.cjs` extension.
 *
 * No writes — just a structured report. The CLI prints a console summary or
 * `--json` payload depending on flags.
 */

import * as path from 'node:path';
import { rewriteCss } from './css';
import { convertTemplate } from './template';
import type { FsAdapter } from './templates';
import { collectHbsFiles } from './templates';
import type { FidelityScore, InspectFinding, InspectReport } from './types';

const collectFilesByExt = (
    root: string,
    fs: FsAdapter,
    exts: ReadonlySet<string>,
    skip: ReadonlySet<string>
): readonly string[] => {
    if (!fs.isDirectory(root)) {
        return [];
    }
    const entries = fs.readdir(root);
    return entries.flatMap(name => {
        if (skip.has(name)) {
            return [];
        }
        const full = path.join(root, name);
        if (fs.isDirectory(full)) {
            return collectFilesByExt(full, fs, exts, skip);
        }
        const ext = path.extname(name);
        return exts.has(ext) ? [full] : [];
    });
};

const SKIP_DIRS: ReadonlySet<string> = new Set([
    'node_modules',
    'dist',
    'build',
    '.git',
    '.next',
    'coverage'
]);

const STYLESHEET_EXTS: ReadonlySet<string> = new Set(['.css', '.scss', '.sass']);

const inspectHbs = (file: string, fs: FsAdapter): InspectFinding => {
    const source = fs.readFile(file);
    const result = convertTemplate({ file, source });
    if (result.hardLimit) {
        return {
            kind:
                result.hardLimit.kind === 'page-layout' ? 'hbs-hard-limit' : 'hbs-unknown-override',
            severity: 'error',
            file,
            message: result.hardLimit.message,
            suggestion: result.hardLimit.suggestion
        };
    }
    return {
        kind: 'hbs-migrate-able',
        severity:
            result.score === 'green' ? 'info' : result.score === 'yellow' ? 'warning' : 'error',
        file,
        message: `migrate-able as override "${result.overrideName}" (${result.score})`,
        suggestion: `compodocx migrate template ${path.relative(process.cwd(), file)} --out <out.js>`
    };
};

const inspectCssFile = (file: string, fs: FsAdapter): readonly InspectFinding[] => {
    const source = fs.readFile(file);
    const result = rewriteCss(file, source, 'conservative');
    if (result.rewriteCount === 0 && result.auditMatches.length === 0) {
        return [];
    }
    return [
        {
            kind: 'css-class-rename',
            severity: 'warning',
            file,
            message: `${result.rewriteCount} class rename(s) available; ${result.auditMatches.length} audit-only`,
            suggestion: `compodocx migrate css ${path.relative(process.cwd(), file)} --dry-run`
        }
    ];
};

const inspectPackageJson = (file: string, fs: FsAdapter): InspectFinding | null => {
    try {
        const content = JSON.parse(fs.readFile(file)) as { type?: string };
        if (content.type === 'module') {
            return {
                kind: 'esm-package',
                severity: 'warning',
                file,
                message:
                    'package.json declares "type": "module" — converted .js overrides will not load via require().',
                suggestion:
                    'Rename converted outputs to .cjs, OR remove the type field in the templates dir, OR keep the templates dir outside the ESM package boundary.'
            };
        }
    } catch {
        // ignore unreadable / non-JSON package.json — not a migrate concern
    }
    return null;
};

const worstSeverityToScore = (findings: readonly InspectFinding[]): FidelityScore => {
    if (findings.some(f => f.severity === 'error')) {
        return 'red';
    }
    if (findings.some(f => f.severity === 'warning')) {
        return 'yellow';
    }
    return 'green';
};

const summaryFor = (findings: readonly InspectFinding[]) =>
    findings.reduce(
        (acc, f) => ({
            ...acc,
            [f.severity === 'error' ? 'red' : f.severity === 'warning' ? 'yellow' : 'green']:
                acc[
                    f.severity === 'error' ? 'red' : f.severity === 'warning' ? 'yellow' : 'green'
                ] + 1
        }),
        { green: 0, yellow: 0, red: 0 }
    );

export const inspectProject = (root: string, fs: FsAdapter): InspectReport => {
    const hbsFindings = collectHbsFiles(root, fs).map(file => inspectHbs(file, fs));

    const cssFiles = collectFilesByExt(root, fs, STYLESHEET_EXTS, SKIP_DIRS);
    const cssFindings = cssFiles.flatMap(file => inspectCssFile(file, fs));

    const packageFinding = (() => {
        const pkgPath = path.join(root, 'package.json');
        return fs.isFile(pkgPath) ? inspectPackageJson(pkgPath, fs) : null;
    })();

    const findings: InspectFinding[] = [
        ...hbsFindings,
        ...cssFindings,
        ...(packageFinding ? [packageFinding] : [])
    ];

    return {
        project: root,
        findings,
        summary: summaryFor(findings),
        score: worstSeverityToScore(findings)
    };
};
