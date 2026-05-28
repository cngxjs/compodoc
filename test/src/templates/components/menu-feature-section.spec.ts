import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import Configuration from '../../../../src/app/configuration';
import {
    clearCustomTemplates,
    registerCustomTemplate,
    renderCustomTemplate
} from '../../../../src/app/engines/custom-template.engine';
import DependenciesEngine from '../../../../src/app/engines/dependencies.engine';
import I18nEngine from '../../../../src/app/engines/i18n.engine';
import { Menu } from '../../../../src/templates/components/Menu';

beforeAll(() => {
    I18nEngine.init('en-US');
});

interface MenuDataFixture {
    components?: any[];
    directives?: any[];
    injectables?: any[];
    pipes?: any[];
    classes?: any[];
    interfaces?: any[];
    guards?: any[];
    interceptors?: any[];
    entities?: any[];
    modules?: any[];
    categorizedByFeature?: Record<string, any[]>;
    categorizedByFeaturePrimary?: Record<string, any[]>;
    categorizedByFeatureReference?: Record<string, any[]>;
    menuLayout?: 'type' | 'feature';
    groupDepth?: number;
    [key: string]: unknown;
}

const baseData = (overrides: Partial<MenuDataFixture>): MenuDataFixture => ({
    modules: [],
    components: [],
    directives: [],
    injectables: [],
    pipes: [],
    classes: [],
    interfaces: [],
    guards: [],
    interceptors: [],
    entities: [],
    miscellaneous: null,
    additionalPages: [],
    appConfig: [],
    routes: null,
    disableRoutesGraph: true,
    disableCoverage: true,
    disableOverview: true,
    disableDependencies: true,
    disableProperties: true,
    hideGenerator: true,
    groupDepth: 2,
    menuLayout: 'type',
    featuresName: '',
    referencesName: '',
    categorizedByFeature: {},
    categorizedByFeaturePrimary: {},
    categorizedByFeatureReference: {},
    ...overrides
});

describe('Menu — feature layout', () => {
    const originalToggle = Configuration.mainData.toggleMenuItems;
    const originalCollapsedAll = Configuration.mainData.collapsedAll;
    const originalModules = DependenciesEngine.modules;

    beforeEach(() => {
        Configuration.mainData.toggleMenuItems = ['features', 'references'];
        Configuration.mainData.collapsedAll = false;
        // getAloneElements consults DependenciesEngine.modules; keep it empty so
        // every component/directive in the fixture is treated as standalone.
        DependenciesEngine.modules = [];
    });

    afterEach(() => {
        Configuration.mainData.toggleMenuItems = originalToggle;
        Configuration.mainData.collapsedAll = originalCollapsedAll;
        DependenciesEngine.modules = originalModules;
        clearCustomTemplates();
    });

    it('renders neither chapter when both bifurcated dicts are empty', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                components: [{ name: 'Foo', file: 'src/foo/foo.component.ts' }]
            })
        });
        expect(html).to.not.include('id="features-links"');
        expect(html).to.not.include('id="references-links"');
        expect(html).to.not.include('id="components-links"');
    });

    it('Features-chapter links never carry #api (default-Info tab intent)', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                components: [{ name: 'CngxToast', file: 'src/toast/toast.component.ts' }],
                categorizedByFeaturePrimary: {
                    toast: [
                        {
                            kind: 'component',
                            hrefPrefix: 'components',
                            name: 'CngxToast',
                            file: 'src/toast/toast.component.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.include('href="components/CngxToast.html"');
        expect(html).to.not.include('href="components/CngxToast.html#api"');
    });

    it('renders a Features chapter mixing primary-kind entities in one folder', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                components: [{ name: 'ButtonComponent', file: 'src/button/button.component.ts' }],
                directives: [{ name: 'RippleDirective', file: 'src/button/ripple.directive.ts' }],
                injectables: [{ name: 'ButtonService', file: 'src/button/button.service.ts' }],
                categorizedByFeaturePrimary: {
                    button: [
                        {
                            kind: 'component',
                            hrefPrefix: 'components',
                            name: 'ButtonComponent',
                            file: 'src/button/button.component.ts'
                        },
                        {
                            kind: 'directive',
                            hrefPrefix: 'directives',
                            name: 'RippleDirective',
                            file: 'src/button/ripple.directive.ts'
                        },
                        {
                            kind: 'injectable',
                            hrefPrefix: 'injectables',
                            name: 'ButtonService',
                            file: 'src/button/button.service.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.include('id="features-links"');
        expect(html).to.include('id="features-group-button"');
        expect(html).to.include('data-cdx-kind="component"');
        expect(html).to.include('data-cdx-kind="directive"');
        expect(html).to.include('data-cdx-kind="injectable"');
        expect(html).to.include('href="components/ButtonComponent.html"');
        expect(html).to.include('href="directives/RippleDirective.html"');
        expect(html).to.include('href="injectables/ButtonService.html"');
    });

    it('renders a References chapter for reference-kind entities, with distinct ids', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                interfaces: [{ name: 'ToastConfig', file: 'src/toast/toast.types.ts' }],
                categorizedByFeatureReference: {
                    toast: [
                        {
                            kind: 'interface',
                            hrefPrefix: 'interfaces',
                            name: 'ToastConfig',
                            file: 'src/toast/toast.types.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.include('id="references-links"');
        expect(html).to.include('id="references-group-toast"');
        // References-chapter links carry `#api` so the API tab activates
        // on page load — interface is in KINDS_WITH_API_TAB.
        expect(html).to.include('href="interfaces/ToastConfig.html#api"');
        // No collisions with the Features chapter's id-prefix.
        expect(html).to.not.include('id="features-links"');
        expect(html).to.not.include('id="features-group-toast"');
    });

    it('renders both chapters when a bucket has items in each', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                components: [{ name: 'CngxToast', file: 'src/toast/toast.component.ts' }],
                interfaces: [{ name: 'ToastConfig', file: 'src/toast/toast.types.ts' }],
                categorizedByFeaturePrimary: {
                    toast: [
                        {
                            kind: 'component',
                            hrefPrefix: 'components',
                            name: 'CngxToast',
                            file: 'src/toast/toast.component.ts'
                        }
                    ]
                },
                categorizedByFeatureReference: {
                    toast: [
                        {
                            kind: 'interface',
                            hrefPrefix: 'interfaces',
                            name: 'ToastConfig',
                            file: 'src/toast/toast.types.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.include('id="features-links"');
        expect(html).to.include('id="references-links"');
        // Same bucket path in both chapters — id-prefix prevents collision.
        expect(html).to.include('id="features-group-toast"');
        expect(html).to.include('id="references-group-toast"');
    });

    it('honours configured featuresName / referencesName labels', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                featuresName: 'Building Blocks',
                referencesName: 'API',
                components: [{ name: 'Foo', file: 'src/foo/foo.component.ts' }],
                interfaces: [{ name: 'FooConfig', file: 'src/foo/foo.types.ts' }],
                categorizedByFeaturePrimary: {
                    foo: [
                        {
                            kind: 'component',
                            hrefPrefix: 'components',
                            name: 'Foo',
                            file: 'src/foo/foo.component.ts'
                        }
                    ]
                },
                categorizedByFeatureReference: {
                    foo: [
                        {
                            kind: 'interface',
                            hrefPrefix: 'interfaces',
                            name: 'FooConfig',
                            file: 'src/foo/foo.types.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.include('Building Blocks');
        // Custom label overrides the i18n default — the chapter heading
        // contains the configured string, not the translated "References".
        expect(html).to.include('>API<');
    });

    it('omits per-kind chapters when menuLayout is feature', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                components: [{ name: 'ButtonComponent', file: 'src/button/button.component.ts' }],
                categorizedByFeaturePrimary: {
                    button: [
                        {
                            kind: 'component',
                            hrefPrefix: 'components',
                            name: 'ButtonComponent',
                            file: 'src/button/button.component.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.not.include('id="components-links"');
        expect(html).to.not.include('id="directives-links"');
    });

    it('keeps per-kind chapters in type layout (backward compat)', () => {
        const html = Menu({
            data: baseData({
                components: [{ name: 'ButtonComponent', file: 'src/button/button.component.ts' }],
                categorizedComponents: {}
            })
        });
        expect(html).to.include('id="components-links"');
        expect(html).to.not.include('id="features-links"');
        expect(html).to.not.include('id="references-links"');
    });

    it('still emits Modules / Additional Pages chapters in feature mode, hides Miscellaneous', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                modules: [{ name: 'AppModule', id: 'm1' }],
                miscellaneous: { variables: [{ name: 'X' }] },
                additionalPages: [
                    {
                        name: 'Guide',
                        path: 'guides',
                        filename: 'guide',
                        depth: 1,
                        children: []
                    }
                ],
                includesName: 'Guides',
                categorizedByFeaturePrimary: {
                    foo: [
                        {
                            kind: 'class',
                            hrefPrefix: 'classes',
                            name: 'Foo',
                            file: 'src/foo/foo.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.include('id="modules-links"');
        expect(html).to.include('id="additional-pages"');
        // Miscellaneous redundant in feature mode — everything moved into References.
        expect(html).to.not.include('id="miscellaneous-links"');
        expect(html).to.include('id="features-links"');
    });

    it('collapsedAll: true forces every chapter AND every nested folder closed', () => {
        Configuration.mainData.toggleMenuItems = [
            'features',
            'references',
            'modules',
            'miscellaneous'
        ];
        Configuration.mainData.collapsedAll = true;
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                modules: [{ name: 'AppModule', id: 'm1' }],
                groupDepth: 4,
                categorizedByFeaturePrimary: {
                    'features/admin-settings': [
                        {
                            kind: 'component',
                            hrefPrefix: 'components',
                            name: 'SettingsComponent',
                            file: 'src/features/admin-settings/settings.component.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.not.match(/class="links collapse in"/);
        expect(html).to.not.include('aria-expanded="true"');
        expect(html).to.include('id="features-links"');
        expect(html).to.include('id="features-group-features"');
    });

    it('collapsedAll: false (default) keeps existing toggleMenuItems / groupDepth behaviour', () => {
        Configuration.mainData.toggleMenuItems = ['features'];
        Configuration.mainData.collapsedAll = false;
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                groupDepth: 2,
                categorizedByFeaturePrimary: {
                    button: [
                        {
                            kind: 'component',
                            hrefPrefix: 'components',
                            name: 'ButtonComponent',
                            file: 'src/button/button.component.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.include('class="links collapse in"');
    });

    it('miscellaneous feature-walk: untagged function lands in References, links to anchor', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                miscellaneous: { functions: [{ name: 'helperFn' }] },
                categorizedByFeatureReference: {
                    util: [
                        {
                            kind: 'function',
                            hrefPrefix: 'miscellaneous/functions',
                            name: 'helperFn',
                            file: 'src/util/helper.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.include('id="references-links"');
        // Anchor-style URL (no @category) — `#api` is NOT appended because
        // the existing `#helperFn` fragment already targets a specific row;
        // stacking `#api` would break the deep-link.
        expect(html).to.include('href="miscellaneous/functions.html#helperFn"');
        expect(html).to.not.include('href="miscellaneous/functions/helperFn.html"');
    });

    it('miscellaneous feature-walk: @category-tagged function lands in References, links to detail page', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                miscellaneous: { functions: [{ name: 'provideToaster', category: 'Toast' }] },
                categorizedByFeatureReference: {
                    Toast: [
                        {
                            kind: 'function',
                            hrefPrefix: 'miscellaneous/functions',
                            name: 'provideToaster',
                            category: 'Toast',
                            file: 'src/toast/providers.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.include('id="references-links"');
        // Function dedicated detail page — `#api` appended because function
        // is in KINDS_WITH_API_TAB and the URL has no existing fragment.
        expect(html).to.include('href="miscellaneous/functions/provideToaster.html#api"');
        expect(html).to.not.include('href="miscellaneous/functions.html#provideToaster"');
    });

    it('@docsKind primary on a function promotes it into Features chapter', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                miscellaneous: {
                    functions: [
                        { name: 'provideFeedback', category: 'ui/feedback', docsKind: 'primary' }
                    ]
                },
                categorizedByFeaturePrimary: {
                    'ui/feedback': [
                        {
                            kind: 'function',
                            hrefPrefix: 'miscellaneous/functions',
                            name: 'provideFeedback',
                            category: 'ui/feedback',
                            docsKind: 'primary',
                            file: 'src/feedback/providers.ts'
                        }
                    ]
                }
            })
        });
        expect(html).to.include('id="features-links"');
        // Function still renders with its kind icon — promotion changes
        // chapter membership, not the per-item visual.
        expect(html).to.include('data-cdx-kind="function"');
    });

    it.each([
        ['variable', 'variables', false],
        ['typealias', 'typealiases', false],
        ['enumeration', 'enumerations', true]
    ])('miscellaneous feature-walk: %s — tagged → page, untagged → anchor', (kind, plural, hasApiTab) => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                categorizedByFeatureReference: {
                    Group: [
                        {
                            kind,
                            hrefPrefix: `miscellaneous/${plural}`,
                            name: 'Tagged',
                            category: 'Group',
                            file: 'src/lib/file.ts'
                        },
                        {
                            kind,
                            hrefPrefix: `miscellaneous/${plural}`,
                            name: 'Untagged',
                            file: 'src/lib/file.ts'
                        }
                    ]
                }
            })
        });
        // Tagged entries get the dedicated detail page; `#api` is appended
        // only for kinds whose detail page actually renders an API tab.
        const taggedSuffix = hasApiTab ? '#api' : '';
        expect(html).to.include(`href="miscellaneous/${plural}/Tagged.html${taggedSuffix}"`);
        // Anchor-style URLs always preserve their existing fragment — no
        // `#api` stacking regardless of kind.
        expect(html).to.include(`href="miscellaneous/${plural}.html#Untagged"`);
    });

    it('honours the menu custom-template override regardless of layout', () => {
        registerCustomTemplate(
            'menu',
            (data: any) => `<nav data-cdx-custom-menu="1">${data.menuLayout}</nav>`
        );
        const html = renderCustomTemplate('menu', {
            menuLayout: 'feature',
            categorizedByFeature: {},
            categorizedByFeaturePrimary: {},
            categorizedByFeatureReference: {}
        });
        expect(html).to.equal('<nav data-cdx-custom-menu="1">feature</nav>');
    });
});
