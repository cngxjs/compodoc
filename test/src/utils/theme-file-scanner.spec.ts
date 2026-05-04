import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { collectThemeFiles } from '../../../src/utils/theme-file-scanner';

describe('Utils - collectThemeFiles', () => {
    let tmp: string;

    const writeFile = (name: string, content = '') => {
        fs.writeFileSync(path.join(tmp, name), content);
    };

    const entityPath = () => path.join(tmp, 'thing.component.ts');

    beforeEach(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-file-scanner-'));
        writeFile('thing.component.ts', '// source file');
    });

    afterEach(() => {
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    it('returns empty array when directory has no theme files', () => {
        writeFile('thing.component.html', '');
        writeFile('README.md', '');
        expect(collectThemeFiles(entityPath())).to.deep.equal([]);
    });

    it('matches all naming variants (theme.scss, foo-theme.css, bar.theme.md, baz_theme.scss, _theme.scss)', () => {
        writeFile('theme.scss', 'a');
        writeFile('foo-theme.css', 'b');
        writeFile('bar.theme.md', 'c');
        writeFile('baz_theme.scss', 'd');
        writeFile('_theme.scss', 'e');

        const result = collectThemeFiles(entityPath());
        const names = result.map(f => f.name).sort();
        expect(names).to.deep.equal([
            '_theme.scss',
            'bar.theme.md',
            'baz_theme.scss',
            'foo-theme.css',
            'theme.scss'
        ]);
    });

    it('ignores non-matching filenames (themes.scss, theme.ts, README.md)', () => {
        writeFile('themes.scss', '');
        writeFile('theme.ts', '');
        writeFile('README.md', '');
        expect(collectThemeFiles(entityPath())).to.deep.equal([]);
    });

    it('sorts results alphabetically regardless of insertion order', () => {
        writeFile('zeta-theme.scss', '1');
        writeFile('alpha-theme.scss', '2');
        writeFile('mid.theme.md', '3');

        const names = collectThemeFiles(entityPath()).map(f => f.name);
        expect(names).to.deep.equal(['alpha-theme.scss', 'mid.theme.md', 'zeta-theme.scss']);
    });

    it('attaches correct language for each file', () => {
        writeFile('a-theme.scss', 'scss');
        writeFile('b-theme.css', 'css');
        writeFile('c.theme.md', 'md');

        const byName = Object.fromEntries(
            collectThemeFiles(entityPath()).map(f => [f.name, f.language])
        );
        expect(byName).to.deep.equal({
            'a-theme.scss': 'scss',
            'b-theme.css': 'css',
            'c.theme.md': 'md'
        });
    });

    it('preserves raw file content verbatim', () => {
        writeFile('demo-theme.scss', '$primary: #ff00aa;\n// raw comment');

        const result = collectThemeFiles(entityPath());
        expect(result).to.have.lengthOf(1);
        expect(result[0].content).to.equal('$primary: #ff00aa;\n// raw comment');
    });

    it('returns empty array when entity path is missing', () => {
        expect(collectThemeFiles('')).to.deep.equal([]);
        expect(collectThemeFiles(undefined)).to.deep.equal([]);
        expect(collectThemeFiles(null)).to.deep.equal([]);
    });

    it('returns empty array when directory is unreadable', () => {
        const bogusPath = path.join(tmp, 'does-not-exist', 'thing.component.ts');
        expect(collectThemeFiles(bogusPath)).to.deep.equal([]);
    });

    it('is case-insensitive on file extension and keyword', () => {
        writeFile('A-Theme.SCSS', 'up');
        writeFile('B.Theme.Md', 'mixed');

        const names = collectThemeFiles(entityPath()).map(f => f.name);
        expect(names).to.deep.equal(['A-Theme.SCSS', 'B.Theme.Md']);
    });
});
