import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { cssTokenFromDescription, cssValueFromFigmaValue } from './figma-token-utils.mjs';

const root = resolve(import.meta.dirname, '../..');
const livePath = resolve(root, process.argv[2] ?? 'tmp/figma-live-variables.json');
const outPath = resolve(root, process.argv[3] ?? 'tmp/figma-live-theme.css');

const live = JSON.parse(readFileSync(livePath, 'utf8'));
const tokenByVariable = new Map(
  live.variables.map((variable) => [variable.name, cssTokenFromDescription(variable.description ?? '')]).filter(([, token]) => token),
);

const lightDeclarations = [];
const darkDeclarations = [];

for (const variable of live.variables) {
  const token = tokenByVariable.get(variable.name);
  if (!token) throw new Error(`Missing CSS token in description for ${variable.name}`);
  lightDeclarations.push(`  ${token}: ${cssValueFromFigmaValue(variable.values.Light, tokenByVariable)};`);
  darkDeclarations.push(`  ${token}: ${cssValueFromFigmaValue(variable.values.Dark, tokenByVariable)};`);
}

const css = `/* @theme Figma Live Export\n * Generated from ${relative(root, livePath)}.\n * Proof artifact only; do not edit by hand.\n */\n\n:root {\n${lightDeclarations.join('\n')}\n}\n\n.dark {\n${darkDeclarations.join('\n')}\n}\n`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, css);
console.log(`Wrote ${relative(root, outPath)} (${live.variables.length} tokens, ${live.modes.join('/')} modes)`);
