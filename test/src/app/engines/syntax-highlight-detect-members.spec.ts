import { describe, expect, it } from 'vitest';
import { detectMembers } from '../../../../src/app/engines/syntax-highlight.engine';

/**
 * Unit tests for `detectMembers()` — the regex-based line scanner that
 * powers the Source tab's sticky scroll stack. Validates:
 *
 *   - Top-level anchor (column 0, no leading whitespace)
 *   - Class/interface/enum scope propagation (Foo.bar naming)
 *   - Depth derivation from leading indent (4-space → depth 1, 8 → 2)
 *   - Keyword blacklist (control-flow identifiers must not match)
 *   - Top-level non-entity patterns (function / const / type)
 *   - Negative test: indented `const x = ...` inside a method body
 *     MUST NOT surface as a top-level member (the ghost-scope bug
 *     that prompted the column-0 anchor fix).
 */
describe('detectMembers', () => {
    it('returns an empty list for empty input', () => {
        expect(detectMembers('')).toEqual([]);
    });

    it('detects a single top-level class at depth 0', () => {
        const code = 'export class Foo {\n}';
        const members = detectMembers(code);
        expect(members).toEqual([{ name: 'Foo', kind: 'class', line: 1, depth: 0 }]);
    });

    it('detects a class plus methods with dotted scope and depth 1', () => {
        const code = [
            'export class Foo {',
            '    constructor(private svc: Bar) {}',
            '    ngOnInit(): void {',
            '        this.svc.load();',
            '    }',
            '    ngOnDestroy(): void {}',
            '}'
        ].join('\n');
        const members = detectMembers(code);
        const names = members.map(m => m.name);
        expect(names).toContain('Foo');
        expect(names).toContain('Foo.ngOnInit');
        expect(names).toContain('Foo.ngOnDestroy');
        const ngOnInit = members.find(m => m.name === 'Foo.ngOnInit');
        expect(ngOnInit?.depth).toBe(1);
    });

    it('detects top-level function at depth 0', () => {
        const code = 'export function createFoo(x: number): Foo {\n    return new Foo(x);\n}';
        const members = detectMembers(code);
        expect(members[0]).toEqual({ name: 'createFoo', kind: 'function', line: 1, depth: 0 });
    });

    it('detects top-level const/let at depth 0', () => {
        const code = [
            "export const API_URL = 'https://example.com';",
            'export let counter: number = 0;'
        ].join('\n');
        const members = detectMembers(code);
        const kinds = members.map(m => m.kind);
        const names = members.map(m => m.name);
        expect(names).toContain('API_URL');
        expect(names).toContain('counter');
        expect(kinds.every(k => k === 'const')).toBe(true);
    });

    it('detects top-level type alias at depth 0', () => {
        const code = 'export type ID = string | number;';
        const members = detectMembers(code);
        expect(members).toEqual([{ name: 'ID', kind: 'type', line: 1, depth: 0 }]);
    });

    it('detects top-level interface + enum', () => {
        const code = [
            'export interface Todo { title: string }',
            'export enum Status { Open, Done }'
        ].join('\n');
        const members = detectMembers(code);
        const kinds = members.map(m => `${m.kind}:${m.name}`);
        expect(kinds).toContain('interface:Todo');
        expect(kinds).toContain('enum:Status');
    });

    it('does NOT emit indented const as a top-level member (ghost-scope regression)', () => {
        const code = [
            'export class Foo {',
            '    onResize(event: Event): void {',
            '        const w = window as Window;',
            '        w.scrollTo(0, 0);',
            '    }',
            '}'
        ].join('\n');
        const members = detectMembers(code);
        const names = members.map(m => m.name);
        expect(names).not.toContain('w');
        expect(names).not.toContain('Foo.w');
    });

    it('does NOT emit control-flow keywords as members', () => {
        const code = [
            'export class Foo {',
            '    run(): void {',
            '        if (x) { return; }',
            '        for (const y of list) { y.do(); }',
            '        while (alive) {}',
            '        switch (mode) {}',
            '    }',
            '}'
        ].join('\n');
        const members = detectMembers(code);
        const names = members.map(m => m.name);
        expect(names).not.toContain('Foo.if');
        expect(names).not.toContain('Foo.for');
        expect(names).not.toContain('Foo.while');
        expect(names).not.toContain('Foo.switch');
        expect(names).not.toContain('Foo.return');
    });

    it('computes depth from leading whitespace (4-space = depth 1, 8-space = depth 2)', () => {
        // Use the modifier-prefixed pattern so the match survives without
        // requiring bracket-level parsing.
        const code = [
            'export class Foo {', // depth 0
            '    public bar(): void {', // depth 1 (4 spaces)
            '        public nested(): void {}', // depth 2 (8 spaces)
            '    }',
            '}'
        ].join('\n');
        const members = detectMembers(code);
        const foo = members.find(m => m.name === 'Foo');
        const bar = members.find(m => m.name === 'Foo.bar');
        const nested = members.find(m => m.name === 'Foo.nested');
        expect(foo?.depth).toBe(0);
        expect(bar?.depth).toBe(1);
        expect(nested?.depth).toBe(2);
    });

    it('emits class + plain property + single-modifier property member', () => {
        // The regex only handles ONE modifier prefix — `private readonly x`
        // (chained modifiers) is not a supported shape and gets skipped.
        const code = [
            'export class Foo {',
            '    count = 0;', // property pattern: `^\s+(\w+)\s*[=:;]`
            '    private run(): void {}' // member pattern: single modifier + name + `(:`
        ].join('\n');
        const members = detectMembers(code);
        const names = members.map(m => m.name);
        expect(names).toContain('Foo');
        expect(names).toContain('Foo.count');
        expect(names).toContain('Foo.run');
    });

    it('clears class scope after a non-entity top-level decl (const/function/type)', () => {
        // After the const, top-level scope resets — subsequent indented
        // lines inside the const's initialiser must NOT be misattributed
        // to the preceding class.
        const code = [
            'export class Foo {}',
            'export const factory = { create(): Foo { return new Foo(); } };'
        ].join('\n');
        const members = detectMembers(code);
        const names = members.map(m => m.name);
        expect(names).toContain('Foo');
        expect(names).toContain('factory');
        // `create` is inside a const object literal, scope was cleared by
        // `factory`, so it must not be attributed to either Foo or factory.
        expect(names).not.toContain('Foo.create');
        expect(names).not.toContain('factory.create');
    });

    it('sets line number to 1-based file position', () => {
        const code = ['// comment', '', 'export class Foo {', '    bar(): void {}', '}'].join('\n');
        const members = detectMembers(code);
        const foo = members.find(m => m.name === 'Foo');
        const bar = members.find(m => m.name === 'Foo.bar');
        expect(foo?.line).toBe(3);
        expect(bar?.line).toBe(4);
    });
});
