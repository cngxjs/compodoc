import { describe, expect, it, vi } from 'vitest';
import { pipeAsync } from '../../../src/lib/pipe';
import { tap, tapAsync } from '../../../src/lib/tap';

describe('tap', () => {
    it('runs the side-effect exactly once per invocation', () => {
        const sideEffect = vi.fn();
        const t = tap<number>(sideEffect);
        t(7);
        expect(sideEffect).toHaveBeenCalledTimes(1);
        expect(sideEffect).toHaveBeenCalledWith(7);
    });

    it('returns the input value unchanged', () => {
        const t = tap<number>(() => undefined);
        expect(t(42)).toBe(42);
        const obj = { id: 1 };
        expect(tap<typeof obj>(() => undefined)(obj)).toBe(obj);
    });
});

describe('tapAsync', () => {
    it('awaits the side-effect before resolving with the value', async () => {
        const order: string[] = [];
        const t = tapAsync<number>(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            order.push('side-effect-done');
        });
        const value = await t(42);
        order.push('returned');
        expect(value).toBe(42);
        expect(order).toEqual(['side-effect-done', 'returned']);
    });

    it('passes the value through unchanged with sync side-effect', async () => {
        const seen: number[] = [];
        const t = tapAsync<number>(n => {
            seen.push(n);
        });
        await expect(t(99)).resolves.toBe(99);
        expect(seen).toEqual([99]);
    });

    it('propagates rejection from the side-effect (aborts a pipe)', async () => {
        await expect(
            pipeAsync(
                1,
                tapAsync<number>(async () => {
                    throw new Error('boom');
                })
            )
        ).rejects.toThrow('boom');
    });
});
