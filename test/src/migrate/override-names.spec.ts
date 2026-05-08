import * as fs from 'node:fs';
import * as path from 'node:path';
import { BLOCK_LEVEL_OVERRIDES, PAGE_LEVEL_OVERRIDES } from '../../../src/migrate/override-names';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const HTML_ENGINE_FILE = path.join(REPO_ROOT, 'src/app/engines/html.engine.ts');
const BLOCKS_DIR = path.join(REPO_ROOT, 'src/templates/blocks');
const PAGES_DIR = path.join(REPO_ROOT, 'src/templates/pages');

const readPageLevelFromSource = (): readonly string[] => {
    const source = fs.readFileSync(HTML_ENGINE_FILE, 'utf8');
    const block = source.match(/CONTEXT_TEMPLATE_MAP[\s\S]*?\{([\s\S]*?)\}/);
    const fromMap = block
        ? Array.from(
              block[1].matchAll(/(?:['"]([\w-]+)['"]|([\w-]+))\s*:\s*['"]([\w-]+)['"]/g),
              m => m[3]
          )
        : [];
    // `menu` and `app-config` are wired outside CONTEXT_TEMPLATE_MAP — pick
    // those up by grepping the engine + page components for renderCustomTemplate.
    const fromEngine = Array.from(
        source.matchAll(/renderCustomTemplate\(\s*['"]([\w-]+)['"]/g),
        m => m[1]
    ).filter(n => !n.startsWith('block-'));
    const fromPages = fs.existsSync(PAGES_DIR)
        ? fs
              .readdirSync(PAGES_DIR)
              .filter(f => f.endsWith('.tsx'))
              .flatMap(file => {
                  const content = fs.readFileSync(path.join(PAGES_DIR, file), 'utf8');
                  return Array.from(
                      content.matchAll(/renderCustomTemplate\(\s*['"]([\w-]+)['"]/g),
                      m => m[1]
                  );
              })
              .filter(n => !n.startsWith('block-'))
        : [];
    return Array.from(new Set([...fromMap, ...fromEngine, ...fromPages])).sort();
};

const readBlockLevelFromSource = (): readonly string[] => {
    if (!fs.existsSync(BLOCKS_DIR)) {
        return [];
    }
    const files = fs.readdirSync(BLOCKS_DIR).filter(f => f.endsWith('.tsx'));
    // Any `renderCustomTemplate(...)` call inside `templates/blocks/` is a
    // block-level override by definition. Most names follow the `block-*`
    // convention, but a handful (e.g. `version-switcher`) historically opted
    // out — derive from the regex without forcing a prefix.
    const names = files.flatMap(file => {
        const content = fs.readFileSync(path.join(BLOCKS_DIR, file), 'utf8');
        return Array.from(
            content.matchAll(/renderCustomTemplate\(\s*['"]([\w-]+)['"]/g),
            m => m[1]
        );
    });
    return Array.from(new Set(names)).sort();
};

describe('migrate/override-names — drift detection', () => {
    it('PAGE_LEVEL_OVERRIDES matches the source-of-truth in html.engine.ts', () => {
        const actual = readPageLevelFromSource();
        const declared = [...PAGE_LEVEL_OVERRIDES].sort();
        expect(declared).toEqual([...actual].sort());
    });

    it('BLOCK_LEVEL_OVERRIDES matches the renderCustomTemplate calls in templates/blocks', () => {
        const actual = readBlockLevelFromSource();
        const declared = [...BLOCK_LEVEL_OVERRIDES].sort();
        expect(declared).toEqual([...actual].sort());
    });
});
