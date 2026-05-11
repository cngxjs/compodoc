import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const specPath = resolve(root, 'docs/figma-design-token-kit.md');
const outPath = resolve(root, process.argv[2] ?? 'tmp/figma-kit-theme.css');

const spec = readFileSync(specPath, 'utf8');
const quotedFontFamilies = new Set(['Instrument Sans', 'Source Sans 3', 'Cascadia Code', 'SF Mono']);
const rows = [...spec.matchAll(/^\| `([^`]+)` \| ([^|]+) \| `(--[a-z0-9-]+)` \|$/gm)].map(
  ([, variable, value, token]) => ({ variable, value: cleanCellValue(value), token }),
);

const tokenByVariable = new Map(rows.map((row) => [row.variable, row.token]));
const declarations = rows.map((row) => {
  const value = resolveValue(row.value, tokenByVariable);
  return `  ${row.token}: ${value};`;
});

const css = `/* @theme Figma Kit Proof\n * Generated from ${relative(root, specPath)}.\n * Proof artifact only; do not edit by hand.\n */\n\n:root {\n${declarations.join('\n')}\n}\n`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, css);
console.log(`Wrote ${relative(root, outPath)} (${rows.length} tokens)`);

function cleanCellValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) return trimmed.slice(1, -1).trim();
  return trimmed;
}

function resolveValue(value, tokenByVariable) {
  if (!value.startsWith('{') || !value.endsWith('}')) return quoteFontFamilies(value);
  const variable = value.slice(1, -1);
  const token = tokenByVariable.get(variable);
  if (!token) throw new Error(`Unknown alias target: ${variable}`);
  return `var(${token})`;
}

function quoteFontFamilies(value) {
  return value
    .split(',')
    .map((part) => {
      const family = part.trim();
      if (quotedFontFamilies.has(family)) return `"${family}"`;
      return family;
    })
    .join(', ');
}
