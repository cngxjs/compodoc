import { shouldShowBanner } from '../../../src/migrate/printer';

describe('migrate/printer — shouldShowBanner', () => {
    const originalIsTTY = process.stdout.isTTY;

    afterEach(() => {
        Object.defineProperty(process.stdout, 'isTTY', {
            value: originalIsTTY,
            configurable: true
        });
    });

    const setTty = (value: boolean) => {
        Object.defineProperty(process.stdout, 'isTTY', { value, configurable: true });
    };

    it('shows the banner when stdout is a TTY and the user gave a subcommand', () => {
        setTty(true);
        expect(shouldShowBanner(['template', 'foo.hbs'])).toBe(true);
        expect(shouldShowBanner(['templates', 'in', '--out', 'out'])).toBe(true);
        expect(shouldShowBanner(['inspect', '.'])).toBe(true);
    });

    it('hides the banner when stdout is piped or redirected (not a TTY)', () => {
        setTty(false);
        expect(shouldShowBanner(['template', 'foo.hbs'])).toBe(false);
        expect(shouldShowBanner(['inspect', '.'])).toBe(false);
    });

    it('hides the banner whenever --json is in argv (machine-readable output stays clean)', () => {
        setTty(true);
        expect(shouldShowBanner(['template', 'foo.hbs', '--json'])).toBe(false);
        expect(shouldShowBanner(['templates', 'in', '--out', 'out', '--json'])).toBe(false);
        expect(shouldShowBanner(['inspect', '.', '--json'])).toBe(false);
    });

    it('hides the banner for help invocations', () => {
        setTty(true);
        expect(shouldShowBanner([])).toBe(false);
        expect(shouldShowBanner(['--help'])).toBe(false);
        expect(shouldShowBanner(['-h'])).toBe(false);
        expect(shouldShowBanner(['help'])).toBe(false);
        expect(shouldShowBanner(['template', '--help'])).toBe(false);
    });
});
