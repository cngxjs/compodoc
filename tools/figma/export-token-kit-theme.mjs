import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { cssValueFromSpecValue, parseSpecRows } from './figma-token-utils.mjs';

const root = resolve(import.meta.dirname, '../..');
const specPath = resolve(root, 'docs/figma-design-token-kit.md');
const outPath = resolve(root, process.argv[2] ?? 'tmp/figma-kit-theme.css');

const spec = readFileSync(specPath, 'utf8');
const rows = parseSpecRows(spec);

const tokenByVariable = new Map(rows.map((row) => [row.variable, row.token]));
const declarations = rows.map((row) => {
  const value = cssValueFromSpecValue(row.value, tokenByVariable);
  return `  ${row.token}: ${value};`;
});

const css = `/* @theme Figma Kit Proof\n * Generated from ${relative(root, specPath)}.\n * Proof artifact only; do not edit by hand.\n */\n\n:root {\n${declarations.join('\n')}\n}\n`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, css);
console.log(`Wrote ${relative(root, outPath)} (${rows.length} tokens)`);
