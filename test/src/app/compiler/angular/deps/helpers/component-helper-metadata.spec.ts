import { Project, ts } from 'ts-morph';
import { ComponentHelper } from '../../../../../../../src/app/compiler/angular/deps/helpers/component-helper';

/**
 * Baseline spec — locks down the CURRENT (broken) behaviour of
 * `getComponentHost`, `getComponentHostDirectives` and `getComponentProviders`
 * against real ts-morph AST input. Each `current-state:` test documents a
 * known bug that Phase 1/2/3 of .internal/compiler-metadata-extraction-fix-plan.md
 * will fix; when the fix lands, the corresponding expected value gets updated
 * in the same commit.
 *
 * Unlike component-helper.spec.ts this file does NOT mock the SymbolHelper —
 * it feeds real AST nodes parsed from inline TypeScript sources, because the
 * `initializer?.text` bug only manifests on real nodes.
 */
describe('ComponentHelper — metadata extraction (baseline)', () => {
    let componentHelper: ComponentHelper;

    beforeEach(() => {
        // Real SymbolHelper is instantiated by the default constructor arg.
        componentHelper = new ComponentHelper({} as any);
    });

    /**
     * Parses a TypeScript source string and returns the property list of the
     * first `@Component({ ... })` decorator found, together with the owning
     * `ts.SourceFile`. Uses an in-memory ts-morph Project so no disk I/O is
     * needed and no global state leaks between tests.
     */
    function parseComponentProps(source: string): {
        props: ReadonlyArray<ts.ObjectLiteralElementLike>;
        srcFile: ts.SourceFile;
    } {
        const project = new Project({ useInMemoryFileSystem: true });
        const srcFile = project.createSourceFile('test.ts', source).compilerNode;

        let found: ts.ObjectLiteralExpression | undefined;
        const visit = (node: ts.Node): void => {
            if (found) {
                return;
            }
            if (
                ts.isCallExpression(node) &&
                ts.isIdentifier(node.expression) &&
                node.expression.text === 'Component' &&
                node.arguments.length > 0 &&
                ts.isObjectLiteralExpression(node.arguments[0])
            ) {
                found = node.arguments[0] as ts.ObjectLiteralExpression;
                return;
            }
            ts.forEachChild(node, visit);
        };
        visit(srcFile);

        if (!found) {
            throw new Error('No @Component(...) call found in source');
        }

        return {
            props: found.properties as unknown as ReadonlyArray<ts.ObjectLiteralElementLike>,
            srcFile
        };
    }

    describe('getComponentHost', () => {
        it('preserves static string-literal keys and values in a Map', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    host: {
                        class: 'my-class',
                        role: 'region'
                    }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            const host = componentHelper.getComponentHost(props);

            expect(host).to.be.instanceOf(Map);
            expect(Array.from(host.entries())).to.deep.equal([
                ['class', 'my-class'],
                ['role', 'region']
            ]);
        });

        it('preserves bracket-style binding keys with string-literal values', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    host: {
                        '[attr.aria-label]': '"Admin settings"',
                        '[class.is-dirty]': 'dirty()',
                        '(document:keydown.escape)': 'onEscape($event)'
                    }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            const host = componentHelper.getComponentHost(props);

            // For string-literal values, `initializer.text` returns the inner
            // content without surrounding quotes. This is why the 5-key host on
            // AdminPanelComponent actually looks fine in the Map today — the
            // bug surfaces only for non-string initializer kinds (below).
            expect(Array.from(host.entries())).to.deep.equal([
                ['[attr.aria-label]', '"Admin settings"'],
                ['[class.is-dirty]', 'dirty()'],
                ['(document:keydown.escape)', 'onEscape($event)']
            ]);
        });

        it('preserves an Identifier value (fast path via node.text)', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    host: {
                        '(click)': handler
                    }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            const host = componentHelper.getComponentHost(props);

            expect(host.get('(click)')).to.equal('handler');
        });

        it('preserves a CallExpression value via getText() fallback (Phase 2a fix)', () => {
            // Before Phase 2a this collapsed to `undefined` because
            // CallExpression has no `.text` field. readNodeText() now falls
            // back to `node.getText()` for non-literal kinds.
            const source = `
                @Component({
                    selector: 'app-x',
                    host: {
                        '(click)': handler()
                    }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            const host = componentHelper.getComponentHost(props);

            expect(host.get('(click)')).to.equal('handler()');
        });

        it('preserves a string-literal containing method-call syntax', () => {
            // Regression: string-literal event handlers must keep their inner
            // content only — readNodeText() must not accidentally emit the
            // outer quotes for literal kinds.
            const source = `
                @Component({
                    selector: 'app-x',
                    host: {
                        '(submit)': 'this.save($event)'
                    }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            const host = componentHelper.getComponentHost(props);

            expect(host.get('(submit)')).to.equal('this.save($event)');
        });

        it('preserves a NumericLiteral value (tabIndex: 0)', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    host: {
                        tabIndex: 0
                    }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            const host = componentHelper.getComponentHost(props);

            expect(host.get('tabIndex')).to.equal('0');
        });

        it('preserves a TemplateExpression value via getText() fallback', () => {
            // NoSubstitutionTemplateLiteral hits the literal .text fast path,
            // but a TemplateExpression with ${...} interpolation has no
            // `.text` — it must fall back to getText() which returns the
            // full backtick form.
            const source = [
                '@Component({',
                "    selector: 'app-x',",
                '    host: {',
                "        '[attr.data-state]': `prefix-${state}`",
                '    }',
                '})',
                'export class X {}'
            ].join('\n');
            const { props } = parseComponentProps(source);
            const host = componentHelper.getComponentHost(props);

            expect(host.get('[attr.data-state]')).to.equal('`prefix-${state}`');
        });
    });

    describe('getComponentHostStructured', () => {
        it('returns an empty array when no host literal is present', () => {
            const source = `
                @Component({
                    selector: 'app-x'
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            expect(componentHelper.getComponentHostStructured(props)).to.deep.equal([]);
        });

        it('classifies a static attribute', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    host: { class: 'my-class' }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            expect(componentHelper.getComponentHostStructured(props)).to.deep.equal([
                { key: 'class', kind: 'static', value: 'my-class' }
            ]);
        });

        it('classifies attr / class / style bracket bindings', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    host: {
                        '[attr.aria-label]': '"Admin settings"',
                        '[class.is-dirty]': 'dirty()',
                        '[style.display]': 'block'
                    }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            expect(componentHelper.getComponentHostStructured(props)).to.deep.equal([
                {
                    key: '[attr.aria-label]',
                    kind: 'attr-binding',
                    value: '"Admin settings"',
                    target: 'aria-label'
                },
                {
                    key: '[class.is-dirty]',
                    kind: 'class-binding',
                    value: 'dirty()',
                    target: 'is-dirty'
                },
                {
                    key: '[style.display]',
                    kind: 'style-binding',
                    value: 'block',
                    target: 'display'
                }
            ]);
        });

        it('classifies a plain bracket property binding', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    host: { '[tabindex]': '0' }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            expect(componentHelper.getComponentHostStructured(props)).to.deep.equal([
                {
                    key: '[tabindex]',
                    kind: 'property-binding',
                    value: '0',
                    target: 'tabindex'
                }
            ]);
        });

        it('classifies an event listener', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    host: { '(document:keydown.escape)': 'onEscape($event)' }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            expect(componentHelper.getComponentHostStructured(props)).to.deep.equal([
                {
                    key: '(document:keydown.escape)',
                    kind: 'event',
                    value: 'onEscape($event)',
                    target: 'document:keydown.escape'
                }
            ]);
        });

        it('replicates the AdminPanelComponent host literal in source order', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    host: {
                        class: 'app-admin-panel',
                        role: 'region',
                        '[attr.aria-label]': '"Admin settings"',
                        '[class.is-dirty]': 'dirty()',
                        '(document:keydown.escape)': 'onEscape($event)'
                    }
                })
                export class X {}
            `;
            const { props } = parseComponentProps(source);
            const entries = componentHelper.getComponentHostStructured(props);
            expect(entries.map(e => [e.key, e.kind])).to.deep.equal([
                ['class', 'static'],
                ['role', 'static'],
                ['[attr.aria-label]', 'attr-binding'],
                ['[class.is-dirty]', 'class-binding'],
                ['(document:keydown.escape)', 'event']
            ]);
        });
    });

    describe('getComponentHostDirectives', () => {
        it('extracts inline object-literal directives with inputs and outputs', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    hostDirectives: [
                        {
                            directive: HighlightDirective,
                            inputs: ['color', 'hoverColor', 'enabled'],
                            outputs: []
                        }
                    ]
                })
                export class X {}
            `;
            const { props, srcFile } = parseComponentProps(source);
            const hostDirs = componentHelper.getComponentHostDirectives(props, srcFile);

            expect(hostDirs).to.deep.equal([
                {
                    name: 'HighlightDirective',
                    inputs: ['color', 'hoverColor', 'enabled'],
                    outputs: []
                }
            ]);
        });

        it('flags a bare directive class reference as unresolved (no local const found)', () => {
            // Bare class references never resolve to a local VariableStatement,
            // so parseHostDirectiveEntry surfaces them as { name, unresolved: true }.
            // Rendering-wise this is correct: the renderer already shows the
            // class name; the `unresolved` flag is available if we ever want to
            // distinguish a bare class from an unresolved imported const.
            const source = `
                @Component({
                    selector: 'app-x',
                    hostDirectives: [TooltipDirective]
                })
                export class X {}
            `;
            const { props, srcFile } = parseComponentProps(source);
            const hostDirs = componentHelper.getComponentHostDirectives(props, srcFile);

            expect(hostDirs).to.deep.equal([{ name: 'TooltipDirective', unresolved: true }]);
        });

        it('dereferences a local const ref to its directive class and inputs', () => {
            // Phase 1: identifier refs to a `const FOO = { directive: ... }`
            // declared in the same source file are now followed. The resulting
            // entry carries the directive class name and its baked-in
            // inputs/outputs, plus `refName` preserving the original identifier
            // text for optional attribution in the renderer.
            const source = `
                const TOOLTIP_HOST_DIRECTIVE = {
                    directive: TooltipDirective,
                    inputs: ['appTooltip: tooltip']
                };
                @Component({
                    selector: 'app-x',
                    hostDirectives: [TOOLTIP_HOST_DIRECTIVE]
                })
                export class X {}
            `;
            const { props, srcFile } = parseComponentProps(source);
            const hostDirs = componentHelper.getComponentHostDirectives(props, srcFile);

            expect(hostDirs).to.deep.equal([
                {
                    name: 'TooltipDirective',
                    inputs: ['appTooltip: tooltip'],
                    outputs: [],
                    refName: 'TOOLTIP_HOST_DIRECTIVE'
                }
            ]);
        });

        it('dereferences a local const ref even without outputs declared', () => {
            const source = `
                const MINIMAL = { directive: MyDirective };
                @Component({
                    selector: 'app-x',
                    hostDirectives: [MINIMAL]
                })
                export class X {}
            `;
            const { props, srcFile } = parseComponentProps(source);
            const hostDirs = componentHelper.getComponentHostDirectives(props, srcFile);

            expect(hostDirs).to.deep.equal([
                {
                    name: 'MyDirective',
                    inputs: [],
                    outputs: [],
                    refName: 'MINIMAL'
                }
            ]);
        });

        it('preserves order across mixed inline, bare class, and dereferenced const', () => {
            const source = `
                const TOOLTIP_HOST_DIRECTIVE = {
                    directive: TooltipDirective,
                    inputs: ['appTooltip: tooltip']
                };
                @Component({
                    selector: 'app-x',
                    hostDirectives: [
                        {
                            directive: HighlightDirective,
                            inputs: ['color'],
                            outputs: []
                        },
                        BareDirective,
                        TOOLTIP_HOST_DIRECTIVE
                    ]
                })
                export class X {}
            `;
            const { props, srcFile } = parseComponentProps(source);
            const hostDirs = componentHelper.getComponentHostDirectives(props, srcFile);

            expect(hostDirs).to.deep.equal([
                { name: 'HighlightDirective', inputs: ['color'], outputs: [] },
                { name: 'BareDirective', unresolved: true },
                {
                    name: 'TooltipDirective',
                    inputs: ['appTooltip: tooltip'],
                    outputs: [],
                    refName: 'TOOLTIP_HOST_DIRECTIVE'
                }
            ]);
        });

        it('flags an imported const ref as unresolved (Phase 1.5 follow-up)', () => {
            // Imported-const dereferencing is explicitly out of scope for Phase 1.
            // TOOLTIP_HOST_DIRECTIVE is declared in another file and only
            // imported here; the local-walk resolver cannot find it in
            // `srcFile.statements`, so the entry is flagged as unresolved.
            // A follow-up (Phase 1.5) may add cross-file resolution.
            const source = `
                import { TOOLTIP_HOST_DIRECTIVE } from './shared';
                @Component({
                    selector: 'app-x',
                    hostDirectives: [TOOLTIP_HOST_DIRECTIVE]
                })
                export class X {}
            `;
            const { props, srcFile } = parseComponentProps(source);
            const hostDirs = componentHelper.getComponentHostDirectives(props, srcFile);

            expect(hostDirs).to.deep.equal([{ name: 'TOOLTIP_HOST_DIRECTIVE', unresolved: true }]);
        });
    });

    describe('getComponentProviders', () => {
        function providersOf(source: string) {
            const { props, srcFile } = parseComponentProps(source);
            return componentHelper.getComponentProviders(props, srcFile);
        }

        it('extracts bare class providers as { name, type: "injectable" }', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    providers: [ApiService]
                })
                export class X {}
            `;
            const result = providersOf(source);

            // parseDeepIndentifier derives type from substring match on the
            // identifier name. ApiService contains "service" → "injectable".
            expect(result).to.have.lengthOf(1);
            expect(result[0]).to.include({ name: 'ApiService', type: 'injectable' });
        });

        it('current-state: useValue primitive collapses to the string-literal token (loses provide target)', () => {
            // Phase 3 bug: `parseProviderConfiguration` returns
            // `prop.getLastToken().getText()` for whichever `useX` key matches
            // first. The `provide:` target is discarded entirely. A provider
            // like `{ provide: APP_VERSION, useValue: '2.0.0-admin' }` enters
            // the pipeline with name: "'2.0.0-admin'" — the quoted string
            // literal, not APP_VERSION. Phase 3 rewrites this to return a
            // structured ProviderEntry.
            const source = `
                @Component({
                    selector: 'app-x',
                    providers: [
                        { provide: APP_VERSION, useValue: '2.0.0-admin' }
                    ]
                })
                export class X {}
            `;
            const result = providersOf(source);

            expect(result).to.have.lengthOf(1);
            expect(result[0].name).to.equal(`'2.0.0-admin'`);
            expect(result[0].type).to.be.undefined;
        });

        it('current-state: useFactory collapses to the factory identifier (loses provide target and deps)', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    providers: [
                        {
                            provide: FEATURE_FLAGS,
                            useFactory: adminFeatureFlagsFactory,
                            deps: [API_BASE_URL]
                        }
                    ]
                })
                export class X {}
            `;
            const result = providersOf(source);

            expect(result).to.have.lengthOf(1);
            expect(result[0].name).to.equal('adminFeatureFlagsFactory');
            expect(result[0].type).to.be.undefined;
        });

        it('current-state: useClass surfaces the class name (coincidentally useful)', () => {
            // Matches the provide: target by accident when provide === useClass,
            // which is the canonical "redundant useClass" pattern.
            const source = `
                @Component({
                    selector: 'app-x',
                    providers: [
                        { provide: ThemeService, useClass: ThemeService }
                    ]
                })
                export class X {}
            `;
            const result = providersOf(source);

            expect(result).to.have.lengthOf(1);
            expect(result[0]).to.include({ name: 'ThemeService', type: 'injectable' });
        });

        it('current-state: useExisting surfaces the aliased token, loses the provide target', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    providers: [
                        { provide: 'AuditToken', useExisting: ADMIN_AUDIT_CHANNEL }
                    ]
                })
                export class X {}
            `;
            const result = providersOf(source);

            expect(result).to.have.lengthOf(1);
            expect(result[0].name).to.equal('ADMIN_AUDIT_CHANNEL');
            expect(result[0].type).to.be.undefined;
        });

        it('current-state: multi-flag provider still reports the useValue primitive', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    providers: [
                        { provide: MAX_RETRIES, useValue: 5, multi: true }
                    ]
                })
                export class X {}
            `;
            const result = providersOf(source);

            expect(result).to.have.lengthOf(1);
            expect(result[0].name).to.equal('5');
            expect(result[0].type).to.be.undefined;
        });

        it('extracts a bare InjectionToken variable reference as its identifier name', () => {
            const source = `
                @Component({
                    selector: 'app-x',
                    providers: [ADMIN_AUDIT_CHANNEL]
                })
                export class X {}
            `;
            const result = providersOf(source);

            expect(result).to.have.lengthOf(1);
            expect(result[0].name).to.equal('ADMIN_AUDIT_CHANNEL');
            expect(result[0].type).to.be.undefined;
        });

        it('current-state: replicates the AdminPanelComponent providers list order and broken values', () => {
            // Mirrors test/fixtures/kitchen-sink-standalone/.../admin-panel.component.ts
            // as of this commit. When Phase 3 rewrites parseProviderConfiguration
            // update the expected names to the structured ProviderEntry shape
            // (name should become the provide: target: APP_VERSION, STORAGE_KEY,
            // FEATURE_FLAGS, 'AuditToken', MAX_RETRIES).
            const source = `
                @Component({
                    selector: 'app-x',
                    providers: [
                        ApiService,
                        { provide: ThemeService, useClass: ThemeService },
                        { provide: APP_VERSION, useValue: '2.0.0-admin' },
                        { provide: STORAGE_KEY, useValue: 'admin-panel-store' },
                        {
                            provide: FEATURE_FLAGS,
                            useFactory: adminFeatureFlagsFactory,
                            deps: [API_BASE_URL]
                        },
                        { provide: 'AuditToken', useExisting: ADMIN_AUDIT_CHANNEL },
                        { provide: MAX_RETRIES, useValue: 5, multi: true },
                        ADMIN_AUDIT_CHANNEL
                    ]
                })
                export class X {}
            `;
            const result = providersOf(source);

            expect(result.map(p => p.name)).to.deep.equal([
                'ApiService',
                'ThemeService',
                `'2.0.0-admin'`,
                `'admin-panel-store'`,
                'adminFeatureFlagsFactory',
                'ADMIN_AUDIT_CHANNEL',
                '5',
                'ADMIN_AUDIT_CHANNEL'
            ]);
        });
    });
});
