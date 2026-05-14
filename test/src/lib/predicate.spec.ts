import { describe, expect, it } from 'vitest';
import { hasProp, isNonNull, isUnique } from '../../../src/lib/predicate';

describe('isNonNull', () => {
    it('returns true for non-null primitives, including 0 and empty string', () => {
        expect(isNonNull(0)).toBe(true);
        expect(isNonNull('')).toBe(true);
        expect(isNonNull(false)).toBe(true);
    });

    it('returns false for null and undefined', () => {
        expect(isNonNull(null)).toBe(false);
        expect(isNonNull(undefined)).toBe(false);
    });

    it('narrows the array element type when used as a filter callback', () => {
        const input: Array<number | null | undefined> = [1, null, 2, undefined, 3];
        const out: number[] = input.filter(isNonNull);
        expect(out).toEqual([1, 2, 3]);
    });
});

describe('isUnique', () => {
    it('deduplicates primitives via filter', () => {
        expect([1, 2, 2, 3, 1, 4].filter(isUnique)).toEqual([1, 2, 3, 4]);
    });

    it('keeps the first occurrence (order-preserving)', () => {
        expect(['b', 'a', 'b', 'c', 'a'].filter(isUnique)).toEqual(['b', 'a', 'c']);
    });

    it('uses strict equality — distinct object references are kept separately', () => {
        const a = { id: 1 };
        const b = { id: 1 };
        // Despite structurally equal, references differ → both survive
        expect([a, b, a].filter(isUnique)).toEqual([a, b]);
    });

    it('returns an empty array for an empty input', () => {
        expect(([] as number[]).filter(isUnique)).toEqual([]);
    });
});

describe('hasProp', () => {
    it('returns true for own properties', () => {
        const obj = { foo: 1, bar: undefined };
        expect(hasProp('foo')(obj)).toBe(true);
        expect(hasProp('bar')(obj)).toBe(true); // own, even if value is undefined
    });

    it('returns false for missing keys', () => {
        const obj: Record<string, unknown> = { foo: 1 };
        expect(hasProp('baz')(obj)).toBe(false);
    });

    it('returns false for inherited properties (no `in` semantics)', () => {
        class Parent {
            inherited = 'value';
        }
        class Child extends Parent {
            own = 'value';
        }
        // Build a plain object with `inherited` on the prototype only
        const proto = { inherited: 'from-proto' };
        const obj = Object.create(proto);
        obj.own = 'from-own';
        expect(hasProp('own')(obj)).toBe(true);
        expect(hasProp('inherited')(obj)).toBe(false);
        // Sanity: instance fields land as own properties even with inheritance
        const child = new Child();
        expect(hasProp('inherited')(child)).toBe(true);
    });

    it('narrows the object type when used as a guard', () => {
        const obj: object = { id: 7 };
        if (hasProp('id')(obj)) {
            // `obj` is now `object & Record<'id', unknown>`
            const v: unknown = obj.id;
            expect(v).toBe(7);
        } else {
            throw new Error('expected hasProp("id") to narrow');
        }
    });
});
