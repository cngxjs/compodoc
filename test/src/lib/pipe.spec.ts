import { describe, expect, it } from 'vitest';
import { pipe, pipeAsync } from '../../../src/lib/pipe';

describe('pipe', () => {
    it('returns the input unchanged when called with one argument (identity)', () => {
        expect(pipe(42)).toBe(42);
        const obj = { id: 1 };
        expect(pipe(obj)).toBe(obj);
    });

    it('applies a single transformation', () => {
        expect(pipe(3, n => n * 2)).toBe(6);
    });

    it('chains multiple transformations left to right', () => {
        const result = pipe(
            5,
            n => n + 1,
            n => n * 2,
            n => `value=${n}`
        );
        expect(result).toBe('value=12');
    });

    it('infers types across the chain', () => {
        // Compile-time smoke: the chain ends in `string`, not `unknown`
        const out: string = pipe(
            1,
            n => n + 1,
            n => String(n)
        );
        expect(out).toBe('2');
    });
});

describe('pipeAsync', () => {
    it('returns a Promise resolving to the input when called with one argument', async () => {
        await expect(pipeAsync(42)).resolves.toBe(42);
    });

    it('awaits each step sequentially', async () => {
        const order: number[] = [];
        const result = await pipeAsync(
            1,
            async n => {
                order.push(n);
                return n + 1;
            },
            async n => {
                order.push(n);
                return n + 1;
            },
            async n => {
                order.push(n);
                return n + 1;
            }
        );
        expect(result).toBe(4);
        expect(order).toEqual([1, 2, 3]);
    });

    it('passes the resolved value of one step as the input to the next', async () => {
        const result = await pipeAsync(
            'hello',
            async s => s.toUpperCase(),
            s => s.length
        );
        expect(result).toBe(5);
    });

    it('propagates rejection from any step (subsequent steps are skipped)', async () => {
        const reached: string[] = [];
        await expect(
            pipeAsync(
                1,
                async n => {
                    reached.push('first');
                    return n + 1;
                },
                async () => {
                    reached.push('second');
                    throw new Error('boom');
                },
                async (n: number) => {
                    reached.push('third');
                    return n;
                }
            )
        ).rejects.toThrow('boom');
        expect(reached).toEqual(['first', 'second']);
    });

    it('handles a mix of sync and async steps', async () => {
        const result = await pipeAsync(
            10,
            n => n + 5,
            async n => n * 2,
            n => n - 1
        );
        expect(result).toBe(29);
    });
});
