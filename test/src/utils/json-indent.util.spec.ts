import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseJsonIndent } from '../../../src/utils/json-indent.util';

/**
 * `parseJsonIndent` lives behind the `--jsonIndent` CLI flag and the
 * `jsonIndent` config-file field. It must be ruthless about bad input —
 * silent fallbacks to `0` would let typos slip past unnoticed.
 *
 * F11 (CLI behavior-contract test pattern from sprint 1) calls for routing
 * through the dispatcher; here that is `parseJsonIndent` directly because the
 * function IS the dispatcher's validation step. Spying on `process.exit` and
 * `process.stderr` lets us assert the user-visible error path without
 * forking a child process.
 */
describe('parseJsonIndent — boundary behavior', () => {
    let exitSpy: ReturnType<typeof vi.spyOn>;
    let stdoutSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
            throw new Error(`process.exit(${code ?? 0})`);
        }) as never);
        stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
        exitSpy.mockRestore();
        stdoutSpy.mockRestore();
    });

    it('accepts 0 (default, single-line)', () => {
        expect(parseJsonIndent(0)).toBe(0);
        expect(parseJsonIndent('0')).toBe(0);
    });

    it('accepts 2 (human-readable)', () => {
        expect(parseJsonIndent(2)).toBe(2);
        expect(parseJsonIndent('2')).toBe(2);
    });

    it('accepts 8 (upper boundary)', () => {
        expect(parseJsonIndent(8)).toBe(8);
        expect(parseJsonIndent('8')).toBe(8);
    });

    it('rejects 9 (just above upper boundary)', () => {
        expect(() => parseJsonIndent(9)).toThrow(/process.exit\(1\)/);
        expect(exitSpy).toHaveBeenCalledWith(1);
        const errors = stdoutSpy.mock.calls.map(c => String(c[0])).join('');
        expect(errors).toMatch(/--jsonIndent.*0 and 8/);
    });

    it('rejects -1 (below lower boundary)', () => {
        expect(() => parseJsonIndent(-1)).toThrow(/process.exit\(1\)/);
    });

    it('rejects "tab" (non-numeric string)', () => {
        expect(() => parseJsonIndent('tab')).toThrow(/process.exit\(1\)/);
        const errors = stdoutSpy.mock.calls.map(c => String(c[0])).join('');
        expect(errors).toMatch(/got "tab"/);
    });

    it('rejects 2.5 (non-integer)', () => {
        expect(() => parseJsonIndent(2.5)).toThrow(/process.exit\(1\)/);
    });

    it('rejects empty string', () => {
        expect(() => parseJsonIndent('')).toThrow(/process.exit\(1\)/);
    });

    it('rejects undefined', () => {
        expect(() => parseJsonIndent(undefined)).toThrow(/process.exit\(1\)/);
    });

    it('error message uses "config" label when source is config', () => {
        try {
            parseJsonIndent(99, 'config');
        } catch {
            // expected
        }
        const errors = stdoutSpy.mock.calls.map(c => String(c[0])).join('');
        expect(errors).toMatch(/jsonIndent in config file/);
    });
});
