import { describe, expect, it, vi } from 'vitest';
import { warnOnce } from '../../../src/utils/jsdoc-tag-warn';
import { logger } from '../../../src/utils/logger';

describe('warnOnce', () => {
    it('fires once for a (result, kind) pair', () => {
        const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const result = { name: 'X' };
        warnOnce(result, 'wcag:invalid', 'first call');
        warnOnce(result, 'wcag:invalid', 'second call same result');
        warnOnce(result, 'wcag:invalid', 'third call same result');
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('first call');
        spy.mockRestore();
    });

    it('fires per distinct kind on the same result', () => {
        const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const result = { name: 'X' };
        warnOnce(result, 'wcag:invalid', 'wcag warn');
        warnOnce(result, 'github:invalid', 'github warn');
        warnOnce(result, 'docsKind:duplicate', 'docskind warn');
        expect(spy).toHaveBeenCalledTimes(3);
        spy.mockRestore();
    });

    it('fires independently per result object', () => {
        const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const a = { name: 'A' };
        const b = { name: 'B' };
        warnOnce(a, 'wcag:invalid', 'A first');
        warnOnce(a, 'wcag:invalid', 'A second');
        warnOnce(b, 'wcag:invalid', 'B first');
        warnOnce(b, 'wcag:invalid', 'B second');
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenNthCalledWith(1, 'A first');
        expect(spy).toHaveBeenNthCalledWith(2, 'B first');
        spy.mockRestore();
    });
});
