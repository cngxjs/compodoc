import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AngularDependencies } from '../../../../src/app/compiler/angular-dependencies';

/**
 * Regression for the bug where AngularDependencies built an IInterfaceDep from
 * the IO object but forgot to copy IO.category onto it. The ioExtractor parsed
 * @category from JSDoc the same way it did for components, so the symptom was
 * a silent drop: every interface lost its explicit category before reaching
 * the feature-grouping pipeline and fell back to folder-based grouping.
 */
describe('AngularDependencies — interface @category mapping', () => {
    let tmpDir: string;
    let interfaceFile: string;
    let interfaces: any[];

    beforeAll(() => {
        tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cdx-iface-cat-')));
        interfaceFile = path.join(tmpDir, 'theme-tokens.interface.ts');
        fs.writeFileSync(
            interfaceFile,
            `/**
 * Theme token contract surfaced to consumers.
 *
 * @category Tokens
 */
export interface ThemeTokens {
    primary: string;
}

/**
 * Untagged sibling — relies on the fallback empty-string default.
 */
export interface PlainConfig {
    enabled: boolean;
}
`
        );

        const deps = new AngularDependencies([interfaceFile], { tsconfigDirectory: tmpDir });
        interfaces = deps.getDependencies().interfaces ?? [];
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('copies @category from the IO object onto the resulting IInterfaceDep', () => {
        const tokens = interfaces.find(i => i.name === 'ThemeTokens');
        expect(tokens).toBeDefined();
        expect(tokens.category).toBe('Tokens');
    });

    it('emits an empty-string category for interfaces without @category', () => {
        const plain = interfaces.find(i => i.name === 'PlainConfig');
        expect(plain).toBeDefined();
        expect(plain.category).toBe('');
    });
});
