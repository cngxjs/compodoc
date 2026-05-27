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
    ...overrides
});

describe('Menu — feature layout', () => {
    const originalToggle = Configuration.mainData.toggleMenuItems;
    const originalCollapsedAll = Configuration.mainData.collapsedAll;
    const originalModules = DependenciesEngine.modules;

    beforeEach(() => {
        Configuration.mainData.toggleMenuItems = ['features'];
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

    it('falls back to type layout when categorizedByFeature is empty', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                components: [{ name: 'Foo', file: 'src/foo/foo.component.ts' }],
                categorizedByFeature: {}
            })
        });
        expect(html).to.not.include('id="features-links"');
        expect(html).to.not.include('id="components-links"');
    });

    it('renders a cross-kind feature chapter mixing entity kinds in one folder', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                components: [{ name: 'ButtonComponent', file: 'src/button/button.component.ts' }],
                directives: [{ name: 'RippleDirective', file: 'src/button/ripple.directive.ts' }],
                injectables: [{ name: 'ButtonService', file: 'src/button/button.service.ts' }],
                categorizedByFeature: {
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

    it('omits per-kind chapters when menuLayout is feature', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                components: [{ name: 'ButtonComponent', file: 'src/button/button.component.ts' }],
                categorizedByFeature: {
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
    });

    it('still emits Modules / Additional Pages / Miscellaneous chapters in feature mode', () => {
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
                categorizedByFeature: {
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
        expect(html).to.include('id="miscellaneous-links"');
        expect(html).to.include('id="features-links"');
    });

    it('collapsedAll: true forces every chapter AND every nested folder closed', () => {
        Configuration.mainData.toggleMenuItems = ['features', 'modules', 'miscellaneous'];
        Configuration.mainData.collapsedAll = true;
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                modules: [{ name: 'AppModule', id: 'm1' }],
                miscellaneous: { variables: [{ name: 'X' }] },
                groupDepth: 4,
                categorizedByFeature: {
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
        // No chapter/group `<ul class="links collapse">` should ever carry
        // the `in` modifier — that's the bootstrap-collapse "expanded" flag.
        expect(html).to.not.match(/class="links collapse in"/);
        expect(html).to.not.include('aria-expanded="true"');
        // The Features chapter and its nested folders still RENDER —
        // collapsedAll only changes initial expansion, not visibility.
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
                categorizedByFeature: {
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
        // The Features chapter (listed in toggleMenuItems) and the top-level
        // `button` group (depth 0 < groupDepth 2) both start expanded.
        expect(html).to.include('class="links collapse in"');
    });

    it('miscellaneous feature-walk: untagged entries link to anchor on collection page', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                miscellaneous: { functions: [{ name: 'helperFn' }] },
                categorizedByFeature: {
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
        expect(html).to.include('href="miscellaneous/functions.html#helperFn"');
        expect(html).to.not.include('href="miscellaneous/functions/helperFn.html"');
    });

    it('miscellaneous feature-walk: @category-tagged entries link to dedicated detail pages', () => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                miscellaneous: { functions: [{ name: 'provideToaster', category: 'Toast' }] },
                categorizedByFeature: {
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
        expect(html).to.include('href="miscellaneous/functions/provideToaster.html"');
        expect(html).to.not.include('href="miscellaneous/functions.html#provideToaster"');
    });

    it.each([
        ['variable', 'variables'],
        ['typealias', 'typealiases'],
        ['enumeration', 'enumerations']
    ])('miscellaneous feature-walk: %s — tagged → page, untagged → anchor', (kind, plural) => {
        const html = Menu({
            data: baseData({
                menuLayout: 'feature',
                categorizedByFeature: {
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
        expect(html).to.include(`href="miscellaneous/${plural}/Tagged.html"`);
        expect(html).to.include(`href="miscellaneous/${plural}.html#Untagged"`);
    });

    it('honours the menu custom-template override regardless of layout', () => {
        registerCustomTemplate(
            'menu',
            (data: any) => `<nav data-cdx-custom-menu="1">${data.menuLayout}</nav>`
        );
        // The override is checked in html.engine.render — directly invoke
        // renderCustomTemplate to verify the registration still wins.
        const html = renderCustomTemplate('menu', {
            menuLayout: 'feature',
            categorizedByFeature: {}
        });
        expect(html).to.equal('<nav data-cdx-custom-menu="1">feature</nav>');
    });
});
