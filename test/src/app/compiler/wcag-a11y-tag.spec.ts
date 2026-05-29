import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AngularDependencies } from '../../../../src/app/compiler/angular-dependencies';

/**
 * `@wcag <level>` and `@a11y <free-form>` surface accessibility-conformance
 * claims at the entity level. Compiler-side: extract from JSDoc, validate
 * level against A | AA | AAA (case-insensitive), propagate verbatim onto
 * the dep object. Invalid levels are dropped silently — never throw.
 */
describe('AngularDependencies — @wcag / @a11y tag extraction', () => {
    let tmpDir: string;
    let deps: AngularDependencies;
    let result: any;

    beforeAll(() => {
        tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cdx-wcag-a11y-')));
        fs.writeFileSync(
            path.join(tmpDir, 'providers.ts'),
            `/**
 * @category ui/feedback
 * @wcag AA
 * @a11y Announces title + description via aria-live="polite". Esc dismisses.
 */
export function provideToasts(): unknown {
    return {};
}

/** Plain helper — no a11y tags. */
export function noTagFn(): void {}

/**
 * @wcag aaa
 */
export function tripleEnhanced(): void {}

/**
 * @wcag BB
 */
export function invalidLevel(): void {}
`
        );
        fs.writeFileSync(
            path.join(tmpDir, 'tokens.ts'),
            `/**
 * @wcag A
 * @a11y Renders \`role="status"\`. Multi-line note
 *       continues on the next line.
 */
export interface BasicChip { id: string }

/** No tag. */
export interface PlainChip { id: string }

/**
 * @a11y Note without a level chip; the note still renders on its own.
 */
export interface NoteOnly { id: string }
`
        );
        deps = new AngularDependencies(
            [path.join(tmpDir, 'providers.ts'), path.join(tmpDir, 'tokens.ts')],
            { tsconfigDirectory: tmpDir }
        );
        result = deps.getDependencies();
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('extracts @wcag AA on a function', () => {
        const fn = result.miscellaneous.functions.find((f: any) => f.name === 'provideToasts');
        expect(fn).toBeDefined();
        expect(fn.wcagLevel).toBe('AA');
    });

    it('extracts @a11y free-form text on a function', () => {
        const fn = result.miscellaneous.functions.find((f: any) => f.name === 'provideToasts');
        expect(fn.a11yNote).toContain('aria-live');
    });

    it('leaves wcagLevel/a11yNote undefined when neither tag is present', () => {
        const fn = result.miscellaneous.functions.find((f: any) => f.name === 'noTagFn');
        expect(fn).toBeDefined();
        expect(fn.wcagLevel).toBeUndefined();
        expect(fn.a11yNote).toBeUndefined();
    });

    it('accepts AAA case-insensitively', () => {
        const fn = result.miscellaneous.functions.find((f: any) => f.name === 'tripleEnhanced');
        expect(fn).toBeDefined();
        expect(fn.wcagLevel).toBe('AAA');
    });

    it('drops an invalid @wcag level silently', () => {
        const fn = result.miscellaneous.functions.find((f: any) => f.name === 'invalidLevel');
        expect(fn).toBeDefined();
        expect(fn.wcagLevel).toBeUndefined();
    });

    it('extracts @wcag A + multi-line @a11y on an interface', () => {
        const iface = result.interfaces.find((i: any) => i.name === 'BasicChip');
        expect(iface).toBeDefined();
        expect(iface.wcagLevel).toBe('A');
        expect(iface.a11yNote).toContain('role="status"');
        expect(iface.a11yNote).toContain('next line');
    });

    it('allows @a11y without @wcag (note renders, chip hidden)', () => {
        const iface = result.interfaces.find((i: any) => i.name === 'NoteOnly');
        expect(iface).toBeDefined();
        expect(iface.wcagLevel).toBeUndefined();
        expect(iface.a11yNote).toContain('still renders');
    });
});
