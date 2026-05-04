import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
    clearCustomTemplates,
    registerCustomTemplate
} from '../../../../src/app/engines/custom-template.engine';
import I18nEngine from '../../../../src/app/engines/i18n.engine';
import { BlockTheming } from '../../../../src/templates/blocks/BlockTheming';
import type { ThemeToken } from '../../../../src/utils/theme-doc-parser';

beforeAll(() => {
    I18nEngine.init('en-US');
});

const makeToken = (overrides: Partial<ThemeToken> = {}): ThemeToken => ({
    name: '--cdx-foo',
    kind: 'css-custom-property',
    type: '<color>',
    defaultValue: '#fff',
    description: 'Surface fill.',
    group: '',
    examples: [],
    since: '',
    deprecated: null,
    see: [],
    file: 'foo.css',
    line: 10,
    ...overrides
});

describe('BlockTheming', () => {
    afterEach(() => {
        clearCustomTemplates();
    });

    it('renders the root section with data-compodoc but without an inner h3 heading', () => {
        const html = BlockTheming({ tokens: [makeToken()] });
        expect(html).to.include('data-compodoc="block-theming"');
        // The tab header already says "Theming" — a duplicate <h3> would be noise.
        expect(html).to.not.match(/<h3[^>]*id="theming"/);
    });

    it('renders an @overview intro as cdx-prose at the top when provided', () => {
        const html = BlockTheming({
            tokens: [makeToken()],
            overview: 'The block below is the canonical source of truth.'
        });
        expect(html).to.include('cdx-theming-overview');
        expect(html).to.include('cdx-prose');
        expect(html).to.include('canonical source of truth');
        // Overview must appear before the tokens table
        const overviewIdx = html.indexOf('cdx-theming-overview');
        const tableIdx = html.indexOf('cdx-theming-tokens');
        expect(overviewIdx).to.be.lessThan(tableIdx);
    });

    it('renders markdown inside the @overview intro', () => {
        const html = BlockTheming({
            tokens: [makeToken()],
            overview: 'A **bold** intro with [a link](https://example.com).'
        });
        expect(html).to.match(/<strong>bold<\/strong>/);
        expect(html).to.include('href="https://example.com"');
    });

    it('omits the overview wrapper when overview is empty or whitespace-only', () => {
        const html = BlockTheming({ tokens: [makeToken()], overview: '   \n  ' });
        expect(html).to.not.include('cdx-theming-overview');
    });

    it('emits one row per token with name/type/default/description cells', () => {
        const html = BlockTheming({
            tokens: [
                makeToken({
                    name: '--cdx-bg',
                    type: '<color>',
                    defaultValue: '#fff'
                })
            ]
        });
        expect(html).to.include('data-compodoc="block-theming-token"');
        expect(html).to.include('--cdx-bg');
        expect(html).to.include('&lt;color>');
        expect(html).to.include('#fff');
        expect(html).to.include('Surface fill');
    });

    it('omits the group sub-heading for ungrouped tokens', () => {
        const html = BlockTheming({ tokens: [makeToken()] });
        expect(html).to.not.match(/<h4 class="cdx-section-heading"/);
    });

    it('renders one <h4> per named group', () => {
        const html = BlockTheming({
            tokens: [
                makeToken({ name: '--a', group: 'container' }),
                makeToken({ name: '--b', group: 'container' }),
                makeToken({ name: '--c', group: 'typography' })
            ]
        });
        const h4s = html.match(/<h4 class="cdx-section-heading"/g) ?? [];
        expect(h4s).to.have.lengthOf(2);
        expect(html).to.include('container');
        expect(html).to.include('typography');
    });

    it('strikes through the name + emits a deprecated badge with reason title', () => {
        const html = BlockTheming({
            tokens: [
                makeToken({
                    name: '--cdx-old',
                    deprecated: 'Use --cdx-new instead.'
                })
            ]
        });
        expect(html).to.include('<s>--cdx-old</s>');
        expect(html).to.include('cdx-badge--deprecated');
        expect(html).to.include('Use --cdx-new instead');
    });

    it('renders a since badge when @since is set', () => {
        const html = BlockTheming({ tokens: [makeToken({ since: '0.1.0' })] });
        expect(html).to.include('cdx-badge--since');
        expect(html).to.include('0.1.0');
    });

    it('renders @example fenced blocks as Shiki snippets', () => {
        const html = BlockTheming({
            tokens: [makeToken({ examples: ['```scss\n$padding: 8px;\n```'] })]
        });
        expect(html).to.include('cdx-theming-example');
        // highlightCode falls back to escaped text when Shiki is uninitialised
        expect(html).to.include('$padding');
    });

    it('renders @see entries as token cross-links and external URLs', () => {
        const html = BlockTheming({
            tokens: [
                makeToken({
                    see: ['https://example.com/spec', '--cdx-other']
                })
            ]
        });
        expect(html).to.include('href="https://example.com/spec"');
        expect(html).to.include('href="#theme-cdx-other"');
    });

    it('renders the collapsible source panel when styleSources is non-empty', () => {
        const html = BlockTheming({
            tokens: [makeToken()],
            styleSources: [
                {
                    file: '/abs/path/btn/button.component.scss',
                    content: '$x: 1;',
                    language: 'scss'
                }
            ]
        });
        expect(html).to.include('cdx-theming-source');
        expect(html).to.include('btn/button.component.scss');
        expect(html).to.include('$x: 1');
    });

    it('omits the source panel when styleSources is empty or missing', () => {
        const html = BlockTheming({ tokens: [makeToken()] });
        expect(html).to.not.include('cdx-theming-source');
    });

    it('honours the `block-theming` custom-template override', () => {
        registerCustomTemplate('block-theming', () => '<aside id="my-custom-theming"/>');
        const html = BlockTheming({ tokens: [makeToken()] });
        expect(html).to.equal('<aside id="my-custom-theming"/>');
    });

    it('honours the `block-theming-token` custom-template override per row', () => {
        registerCustomTemplate(
            'block-theming-token',
            (data: any) => `<tr data-stub="${data.token.name}"></tr>`
        );
        const html = BlockTheming({
            tokens: [makeToken({ name: '--cdx-a' }), makeToken({ name: '--cdx-b' })]
        });
        expect(html).to.include('data-stub="--cdx-a"');
        expect(html).to.include('data-stub="--cdx-b"');
        // Default cell wrappers should NOT appear when each row was overridden
        expect(html).to.not.include('cdx-theming-name-cell');
    });

    it('handles undefined tokens prop as empty list', () => {
        const html = BlockTheming({ tokens: undefined as any });
        expect(html).to.include('data-compodoc="block-theming"');
        expect(html).to.not.include('data-compodoc="block-theming-token"');
    });
});
