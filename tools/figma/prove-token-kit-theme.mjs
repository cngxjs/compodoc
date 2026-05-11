import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const outDir = '/tmp/compodocx-figma-kit-proof';
const liveOutDir = '/tmp/compodocx-figma-live-proof';
const generatedTheme = resolve(root, 'tmp/figma-kit-theme.css');
const liveVariables = resolve(root, 'tmp/figma-live-variables.json');
const liveTheme = resolve(root, 'tmp/figma-live-theme.css');
const generatedCustomCss = resolve(outDir, 'styles/custom.css');
const liveCustomCss = resolve(liveOutDir, 'styles/custom.css');

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

if (existsSync(liveVariables)) {
  run('node', ['tools/figma/validate-live-figma-tokens.mjs', 'tmp/figma-live-variables.json']);
  run('node', ['tools/figma/export-live-figma-theme.mjs', 'tmp/figma-live-variables.json', 'tmp/figma-live-theme.css']);
  run('node', [
    './bin/index-cli.js',
    '--no-multiVersion',
    '-p',
    './test/fixtures/standalone-app/src/tsconfig.json',
    '-d',
    liveOutDir,
    '--theme',
    './tmp/figma-live-theme.css',
    '--disableSearch',
  ]);
  assertFileContains(liveTheme, ['/* @theme Figma Live Export', ':root {', '.dark {', '--color-cdx-bg:', '--color-cdx-graph-bg: var(--color-cdx-bg-alt);']);
  assertFileContains(liveCustomCss, ['/* @theme Figma Live Export', ':root {', '.dark {', '--color-cdx-bg:', '--color-cdx-graph-bg: var(--color-cdx-bg-alt);']);
}

console.log('Figma token kit proof passed');

function run(command, args, options = {}) {
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
