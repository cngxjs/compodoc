/**
 * `compodocx migrate <subcommand>` — CLI dispatcher.
 *
 * Wires the four subcommands behind a small commander instance that's
 * created lazily on demand (the migrate path is rarely the user's primary
 * use-case, so we don't want to pay its setup cost on every invocation).
 *
 * Designed to be re-entrant from `src/index-cli.ts` — that file detects the
 * `migrate` first arg before commander is configured for the main CLI and
 * delegates here.
 */

import * as path from 'node:path';
import { Command } from 'commander';
import { realFs } from './fs-adapter';
import { exitCodeOf } from './report';
import { convertTemplate } from './template';
import { convertDirectory } from './templates';
import type { ConvertResult, RunSummary } from './types';

const printConvertResult = (result: ConvertResult, suppressWarnings: boolean): void => {
    const tag = result.score === 'green' ? '[OK]' : result.score === 'yellow' ? '[WARN]' : '[ERR]';
    const where = path.relative(process.cwd(), result.file) || result.file;
    console.log(`${tag} ${where} (${result.score})`);
    if (result.hardLimit) {
        console.log(`  hard-limit: ${result.hardLimit.message}`);
        console.log(`  suggestion: ${result.hardLimit.suggestion}`);
    }
    if (suppressWarnings) {
        return;
    }
    for (const w of result.warnings) {
        console.log(`  ${w.kind}@${w.line}: ${w.message}`);
    }
};

const printSummary = (summary: RunSummary): void => {
    const { green, yellow, red } = summary.summary;
    console.log(`Summary: ${green} green, ${yellow} yellow, ${red} red.`);
};

interface CommonFlags {
    readonly dryRun?: boolean;
    readonly json?: boolean;
    readonly noWarnings?: boolean;
}

const runTemplate = async (
    file: string,
    out: string | undefined,
    flags: CommonFlags
): Promise<number> => {
    const fs = realFs();
    if (!fs.isFile(path.resolve(file))) {
        console.error(`migrate template: file not found: ${file}`);
        return 2;
    }
    const source = fs.readFile(path.resolve(file));
    const result = convertTemplate({ file: path.resolve(file), source });
    if (flags.json) {
        const payload = { ...result, output: result.output };
        console.log(JSON.stringify(payload, null, 2));
        return exitCodeOf(result.score);
    }
    printConvertResult(result, flags.noWarnings ?? false);
    if (!result.hardLimit && !flags.dryRun && out) {
        fs.ensureDir(path.dirname(path.resolve(out)));
        fs.writeFile(path.resolve(out), result.output);
        console.log(`wrote ${path.relative(process.cwd(), path.resolve(out))}`);
    } else if (!result.hardLimit && flags.dryRun) {
        console.log('--- preview ---');
        console.log(result.output);
    }
    return exitCodeOf(result.score);
};

const runTemplates = async (
    inputDir: string,
    outDir: string,
    flags: CommonFlags
): Promise<number> => {
    const fs = realFs();
    const inputRoot = path.resolve(inputDir);
    const outputRoot = path.resolve(outDir);
    const summary = convertDirectory({
        inputRoot,
        outputRoot,
        fs,
        dryRun: flags.dryRun ?? false
    });
    if (flags.json) {
        console.log(JSON.stringify(summary, null, 2));
        return exitCodeOf(summary.score);
    }
    for (const result of summary.files) {
        printConvertResult(result, flags.noWarnings ?? false);
    }
    printSummary(summary);
    return exitCodeOf(summary.score);
};

export const runMigrateCli = async (argv: readonly string[]): Promise<number> => {
    const program = new Command();
    program
        .name('compodocx migrate')
        .description('Migrate compodoc Handlebars templates to compodocx JS overrides.')
        .helpOption('-h, --help', 'Show migrate CLI help');

    let exitCode = 0;

    program
        .command('template <file>')
        .description('Convert a single .hbs file to a JS override.')
        .option('--out <file>', 'Write output to <file> (default: stdout summary only)')
        .option('--dry-run', 'Preview output without writing to disk')
        .option('--json', 'Emit a machine-readable JSON report')
        .option('--no-warnings', 'Suppress fidelity warnings in console output')
        .action(async (file: string, opts: CommonFlags & { out?: string }) => {
            exitCode = await runTemplate(file, opts.out, opts);
        });

    program
        .command('templates <hbs-dir>')
        .description('Convert every .hbs file in a directory to JS overrides.')
        .requiredOption('--out <dir>', 'Output directory (will be created if missing)')
        .option('--dry-run', 'Walk the input tree without writing to disk')
        .option('--json', 'Emit a machine-readable JSON report')
        .option('--no-warnings', 'Suppress fidelity warnings in console output')
        .action(async (hbsDir: string, opts: CommonFlags & { out: string }) => {
            exitCode = await runTemplates(hbsDir, opts.out, opts);
        });

    program
        .command('css <file-or-dir>')
        .description('Rewrite compodoc CSS class names to compodocx equivalents.')
        .option('--aggressive', 'Also rewrite .html/.ts/.tsx (false-positive risk)')
        .option('--dry-run', 'Preview the rewrite without writing to disk')
        .option('--json', 'Emit a machine-readable JSON report')
        .option('--no-warnings', 'Suppress fidelity warnings in console output')
        .action(async () => {
            console.error('migrate css: not implemented in this commit (see PR commit 3).');
            exitCode = 2;
        });

    program
        .command('inspect <project-path>')
        .description('Audit a compodoc project for migrate-able templates and CSS classes.')
        .option('--json', 'Emit a machine-readable JSON report')
        .option('--no-warnings', 'Suppress fidelity warnings in console output')
        .action(async () => {
            console.error('migrate inspect: not implemented in this commit (see PR commit 3).');
            exitCode = 2;
        });

    await program.parseAsync(argv, { from: 'user' });
    return exitCode;
};
