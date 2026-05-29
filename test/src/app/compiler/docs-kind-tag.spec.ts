import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AngularDependencies } from '../../../../src/app/compiler/angular-dependencies';

/**
 * `@docsKind primary` promotes a reference-kind symbol into the Features
 * chapter under `menuLayout: 'feature'`. The compiler-side responsibility
 * here is simply to extract the tag and propagate it onto the dep object —
 * the bifurcation itself lives in `dependencies.engine.ts`.
 */
describe('AngularDependencies — @docsKind primary tag extraction', () => {
    let tmpDir: string;
    let deps: AngularDependencies;
    let result: any;

    beforeAll(() => {
        tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cdx-docs-kind-')));
        fs.writeFileSync(
            path.join(tmpDir, 'providers.ts'),
            `/**
 * Bootstrap provider — primary entry point for the feedback feature.
 * @category ui/feedback
 * @docsKind primary
 */
export function provideFeedback(): unknown {
    return {};
}

/** Plain helper — no docsKind tag. */
export function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
}
`
        );
        fs.writeFileSync(
            path.join(tmpDir, 'tokens.ts'),
            `/**
 * Public token contract.
 * @docsKind primary
 */
export interface PrimaryToken { id: string }

/** Internal-looking type — left at default placement. */
export interface RegularType { id: string }

/**
 * Promoted typealias.
 * @docsKind primary
 */
export type PromotedAlias = string;

/** Typo in the tag value falls back to default placement (no error). */
export interface TypoTagged { id: string }
`
        );
        fs.writeFileSync(
            path.join(tmpDir, 'state.ts'),
            `/**
 * @docsKind primary
 */
export const STATE_TOKEN = Symbol('state');

/** Plain const — no promotion. */
export const REGULAR = 42;

/**
 * @docsKind primary
 */
export enum PromotedMode { On, Off }

/** Default enum. */
export enum RegularMode { Auto }
`
        );
        // The `TypoTagged` interface needs a real tag with a non-primary value
        // — append it after the initial write so the @docsKind line lives on
        // a real JSDoc comment we control.
        fs.appendFileSync(
            path.join(tmpDir, 'tokens.ts'),
            `\n/**\n * @docsKind reference\n */\nexport interface Inverted { id: string }\n`
        );
        deps = new AngularDependencies(
            [
                path.join(tmpDir, 'providers.ts'),
                path.join(tmpDir, 'tokens.ts'),
                path.join(tmpDir, 'state.ts')
            ],
            { tsconfigDirectory: tmpDir }
        );
        result = deps.getDependencies();
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('marks a function with @docsKind primary', () => {
        const fn = result.miscellaneous.functions.find((f: any) => f.name === 'provideFeedback');
        expect(fn).toBeDefined();
        expect(fn.docsKind).toBe('primary');
    });

    it('leaves docsKind undefined on a function without the tag', () => {
        const fn = result.miscellaneous.functions.find((f: any) => f.name === 'clamp01');
        expect(fn).toBeDefined();
        expect(fn.docsKind).toBeUndefined();
    });

    it('marks an interface with @docsKind primary', () => {
        const iface = result.interfaces.find((i: any) => i.name === 'PrimaryToken');
        expect(iface).toBeDefined();
        expect(iface.docsKind).toBe('primary');
    });

    it('marks a typealias with @docsKind primary', () => {
        const alias = result.miscellaneous.typealiases.find((t: any) => t.name === 'PromotedAlias');
        expect(alias).toBeDefined();
        expect(alias.docsKind).toBe('primary');
    });

    it('marks a variable with @docsKind primary', () => {
        const variable = result.miscellaneous.variables.find((v: any) => v.name === 'STATE_TOKEN');
        expect(variable).toBeDefined();
        expect(variable.docsKind).toBe('primary');
    });

    it('marks an enumeration with @docsKind primary', () => {
        const enumeration = result.miscellaneous.enumerations.find(
            (e: any) => e.name === 'PromotedMode'
        );
        expect(enumeration).toBeDefined();
        expect(enumeration.docsKind).toBe('primary');
    });

    it('does not set docsKind for siblings without the tag', () => {
        const variable = result.miscellaneous.variables.find((v: any) => v.name === 'REGULAR');
        expect(variable).toBeDefined();
        expect(variable.docsKind).toBeUndefined();

        const enumeration = result.miscellaneous.enumerations.find(
            (e: any) => e.name === 'RegularMode'
        );
        expect(enumeration).toBeDefined();
        expect(enumeration.docsKind).toBeUndefined();
    });

    it('falls back silently when @docsKind has a non-primary value (typo, inverse, etc.)', () => {
        const inverted = result.interfaces.find((i: any) => i.name === 'Inverted');
        expect(inverted).toBeDefined();
        // No `primary` value → docsKind stays absent. The inverse override
        // is intentionally not supported in this release.
        expect(inverted.docsKind).toBeUndefined();
    });
});
