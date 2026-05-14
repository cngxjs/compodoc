import { describe, expect, it } from 'vitest';
import { err, isErr, isOk, mapResult, ok, type Result } from '../../../src/lib/result';

describe('Result', () => {
    describe('ok', () => {
        it('returns a Result with ok=true and the wrapped value', () => {
            const r = ok(42);
            expect(r).toEqual({ ok: true, value: 42 });
        });

        it('preserves the value reference for objects', () => {
            const v = { id: 1 };
            const r = ok(v);
            expect(r.ok).toBe(true);
            if (r.ok) {
                expect(r.value).toBe(v);
            }
        });
    });

    describe('err', () => {
        it('returns a Result with ok=false and the wrapped message', () => {
            const r = err('boom');
            expect(r).toEqual({ ok: false, message: 'boom' });
        });

        it('accepts non-string error payloads (custom E type)', () => {
            const r = err({ code: 404, reason: 'not found' });
            expect(r.ok).toBe(false);
            if (isErr(r)) {
                expect(r.message).toEqual({ code: 404, reason: 'not found' });
            }
        });
    });

    describe('isOk / isErr', () => {
        it('isOk narrows to the ok variant', () => {
            const r: Result<number, string> = ok(7);
            expect(isOk(r)).toBe(true);
            expect(isErr(r)).toBe(false);
            if (isOk(r)) {
                // Compile-time narrowing — `r.value` is `number`, not `unknown`
                const v: number = r.value;
                expect(v).toBe(7);
            }
        });

        it('isErr narrows to the err variant', () => {
            const r: Result<number, string> = err('nope');
            expect(isErr(r)).toBe(true);
            expect(isOk(r)).toBe(false);
            if (isErr(r)) {
                const m: string = r.message;
                expect(m).toBe('nope');
            }
        });
    });

    describe('mapResult', () => {
        it('transforms the wrapped value on the ok branch', () => {
            const r = mapResult(ok(3), n => n * 2);
            expect(r).toEqual({ ok: true, value: 6 });
        });

        it('passes through unchanged on the err branch', () => {
            const r: Result<number, string> = err('skip');
            const mapped = mapResult(r, n => n * 2);
            expect(mapped).toEqual({ ok: false, message: 'skip' });
        });

        it('does not call the mapper when the input is err', () => {
            let called = 0;
            mapResult(err('x'), (_n: number) => {
                called++;
                return 0;
            });
            expect(called).toBe(0);
        });
    });
});
