import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const outDir = '/tmp/compodocx-figma-kit-proof';
const generatedTheme = resolve(root, 'tmp/figma-kit-theme.css');
const generatedCustomCss = resolve(outDir, 'styles/custom.css');

run('node', ['tools/figma/validate-token-kit.mjs']);
run('node', ['tools/figma/export-token-kit-theme.mjs']);
run('node', [
  './bin/index-cli.js',
  '--no-multiVersion',
  '-p',
  './test/fixtures/standalone-app/src/tsconfig.json',
  '-d',
  outDir,
  '--theme',
  './tmp/figma-kit-theme.css',
  '--disableSearch',
]);

assertFileContains(generatedTheme, ['/* @theme Figma Kit Proof', '--color-cdx-bg:', '--color-cdx-graph-bg: var(--color-cdx-bg-alt);']);
assertFileContains(generatedCustomCss, ['/* @theme Figma Kit Proof', '--color-cdx-bg:', '--color-cdx-graph-bg: var(--color-cdx-bg-alt);']);

console.log('Figma token kit proof passed');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function assertFileContains(filePath, needles) {
  if (!existsSync(filePath)) throw new Error(`Expected file missing: ${filePath}`);
  const content = readFileSync(filePath, 'utf8');
  for (const needle of needles) {
    if (!content.includes(needle)) throw new Error(`Expected ${filePath} to contain: ${needle}`);
  }
}
