import * as path from 'node:path';
import { memoryFs } from '../../../src/migrate/fs-adapter';
import { collectHbsFiles, convertDirectory } from '../../../src/migrate/templates';

const ROOT = path.resolve('/virtual/templates');
const OUT = path.resolve('/virtual/out');

describe('migrate/templates — directory walker', () => {
    it('collects nested .hbs files and ignores non-hbs siblings', () => {
        const { adapter } = memoryFs({
            [path.join(ROOT, 'partials/component.hbs')]: '<p>{{name}}</p>',
            [path.join(ROOT, 'partials/block-method.hbs')]: '<ul>{{name}}</ul>',
            [path.join(ROOT, 'partials/notes.txt')]: 'irrelevant',
            [path.join(ROOT, 'README.md')]: 'docs'
        });
        const found = collectHbsFiles(ROOT, adapter);
        // Normalize to POSIX separators — `path.relative` returns native ones
        // (`\` on Windows). The implementation correctly returns native paths;
        // only the assertion needs the cross-platform comparison.
        const normalized = found.map(f => path.relative(ROOT, f).split(path.sep).join('/')).sort();
        expect(normalized).toEqual(['partials/block-method.hbs', 'partials/component.hbs']);
    });

    it('mirrors the partials/ structure under --out and renames .hbs → .js', () => {
        const { adapter, state } = memoryFs({
            [path.join(ROOT, 'partials/component.hbs')]: '<p>{{component.name}}</p>'
        });
        const summary = convertDirectory({
            inputRoot: ROOT,
            outputRoot: OUT,
            fs: adapter
        });
        expect(summary.files).toHaveLength(1);
        expect(summary.files[0].score).toBe('green');
        expect(state[path.join(OUT, 'partials/component.js')]).toContain(
            'module.exports = function (data, helpers)'
        );
    });

    it('rejects page.hbs as a hard limit instead of silently writing', () => {
        const { adapter, state } = memoryFs({
            [path.join(ROOT, 'page.hbs')]: '<!doctype html><html></html>',
            [path.join(ROOT, 'partials/component.hbs')]: '<p>{{component.name}}</p>'
        });
        const summary = convertDirectory({
            inputRoot: ROOT,
            outputRoot: OUT,
            fs: adapter
        });
        const pageResult = summary.files.find(f => f.file.endsWith('page.hbs'));
        expect(pageResult?.hardLimit?.kind).toBe('page-layout');
        expect(pageResult?.output).toBe('');
        expect(state[path.join(OUT, 'page.js')]).toBeUndefined();
        expect(summary.score).toBe('red');
    });

    it('honors --dry-run without writing to disk', () => {
        const { adapter, state } = memoryFs({
            [path.join(ROOT, 'partials/component.hbs')]: '<p>{{component.name}}</p>'
        });
        convertDirectory({
            inputRoot: ROOT,
            outputRoot: OUT,
            fs: adapter,
            dryRun: true
        });
        expect(state[path.join(OUT, 'partials/component.js')]).toBeUndefined();
    });
});
