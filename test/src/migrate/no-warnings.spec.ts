/**
 * The `--no-warnings` flag is wired into all four subcommands but its
 * behaviour wasn't asserted anywhere — drift risk. This spec captures
 * stdout writes during a `runMigrateCli` invocation and asserts:
 *
 * 1. Without --no-warnings, the warning detail lines (e.g. "lossy-rename@…")
 *    appear in the output.
 * 2. With --no-warnings, the result tag still prints (so the user knows
 *    the file ran), but the per-warning detail lines are suppressed.
 *
 * Routing the test through the CLI entry rather than the internal print
 * helpers also exercises the commander-flag plumbing.
 */

import * as path from 'node:path';
import { runMigrateCli } from '../../../src/migrate/index';

const FIXTURE = path.resolve(__dirname, '../../fixtures/migrate-fixtures/hbs/pipe.hbs');

const captureStdout = async (work: () => Promise<unknown>): Promise<string> => {
    const writes: string[] = [];
    const orig = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: unknown) => {
        writes.push(String(chunk));
        return true;
    }) as typeof process.stdout.write;
    try {
        await work();
    } finally {
        process.stdout.write = orig;
    }
    return writes.join('');
};

describe('migrate/--no-warnings flag', () => {
    it('emits the lossy-rename warning detail line by default (yellow fixture)', async () => {
        const out = await captureStdout(() => runMigrateCli(['template', FIXTURE]));
        expect(out).toMatch(/\[WARN\]/); // result tag
        expect(out).toMatch(/lossy-rename/); // detail line present
    });

    it('suppresses warning detail lines when --no-warnings is set, but keeps the result tag', async () => {
        const out = await captureStdout(() =>
            runMigrateCli(['template', FIXTURE, '--no-warnings'])
        );
        expect(out).toMatch(/\[WARN\]/); // result tag still emitted
        expect(out).not.toMatch(/lossy-rename/); // detail line suppressed
    });
});
