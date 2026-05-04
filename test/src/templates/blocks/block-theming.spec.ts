import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { clearCustomTemplates } from '../../../../src/app/engines/custom-template.engine';
import I18nEngine from '../../../../src/app/engines/i18n.engine';
import { BlockTheming, slugifyThemeFileName } from '../../../../src/templates/blocks/BlockTheming';

beforeAll(() => {
    I18nEngine.init('en-US');
});

describe('BlockTheming', () => {
    afterEach(() => {
        clearCustomTemplates();
    });

    describe('slugifyThemeFileName', () => {
        it('collapses dots, hyphens, underscores into single hyphens', () => {
            expect(slugifyThemeFileName('button.theme.scss')).to.equal('button-theme-scss');
            expect(slugifyThemeFileName('Foo_Theme.SCSS')).to.equal('foo-theme-scss');
            expect(slugifyThemeFileName('_theme.scss')).to.equal('theme-scss');
            expect(slugifyThemeFileName('a-b..c.md')).to.equal('a-b-c-md');
        });
    });

    it('renders root section with data-compodoc="block-theming" and heading', () => {
        const html = BlockTheming({
            themeFiles: [{ name: 'theme.scss', content: '$x: 1;', language: 'scss' }]
        });
        expect(html).to.include('data-compodoc="block-theming"');
        expect(html).to.include('id="theming"');
    });

    it('emits nothing but the root when themeFiles is empty', () => {
        const html = BlockTheming({ themeFiles: [] });
        expect(html).to.include('data-compodoc="block-theming"');
        expect(html).to.not.include('data-compodoc="block-theming-file"');
    });

    it('wraps .md content in cdx-prose and renders Markdown (not raw text)', () => {
        const html = BlockTheming({
            themeFiles: [
                {
                    name: 'notes.theme.md',
                    content: '# Hello\n\nParagraph.',
                    language: 'md'
                }
            ]
        });
        expect(html).to.include('cdx-prose');
        expect(html).to.match(/<h1[^>]*>Hello/);
        expect(html).to.include('<p>Paragraph.</p>');
    });

    it('renders per-file section with permalink anchor using slug', () => {
        const html = BlockTheming({
            themeFiles: [{ name: 'button.theme.scss', content: '$c: red;', language: 'scss' }]
        });
        expect(html).to.include('data-compodoc="block-theming-file"');
        expect(html).to.include('id="button-theme-scss"');
        expect(html).to.include('href="#button-theme-scss"');
        expect(html).to.include('button.theme.scss');
    });

    it('emits a section per file when multiple files are present', () => {
        const html = BlockTheming({
            themeFiles: [
                { name: 'a-theme.scss', content: '', language: 'scss' },
                { name: 'b-theme.css', content: '', language: 'css' },
                { name: 'c.theme.md', content: '', language: 'md' }
            ]
        });
        const matches = html.match(/data-compodoc="block-theming-file"/g) ?? [];
        expect(matches.length).to.equal(3);
    });

    it('handles undefined themeFiles as empty list', () => {
        const html = BlockTheming({ themeFiles: undefined as any });
        expect(html).to.include('data-compodoc="block-theming"');
    });
});
