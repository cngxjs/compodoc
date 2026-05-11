import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const templatePath = resolve(root, 'src/themes/theme-template.css');
const specPath = resolve(root, 'docs/figma-design-token-kit.md');

const template = readFileSync(templatePath, 'utf8');
const spec = readFileSync(specPath, 'utf8');

const tokenPattern = /--[a-z0-9-]+(?=\s*:)/g;
const cssNamePattern = /`(--[a-z0-9-]+)`/g;

const templateTokens = unique(template.match(tokenPattern) ?? []);
const specTokens = unique([...spec.matchAll(cssNamePattern)].map((match) => match[1]));
const templateValues = parseTemplateValues(template);

const missingFromSpec = templateTokens.filter((token) => !specTokens.includes(token));
const extraInSpec = specTokens.filter((token) => !templateTokens.includes(token));
const duplicatedSpecTokens = duplicates([...spec.matchAll(cssNamePattern)].map((match) => match[1]));

const rows = [...spec.matchAll(/^\| `([^`]+)` \| ([^|]+) \| `(--[a-z0-9-]+)` \|$/gm)].map(
  ([, variable, value, token]) => ({ variable, value: cleanCellValue(value), token }),
);
const variables = rows.map((row) => row.variable);
const duplicatedVariables = duplicates(variables);
const aliasRows = rows.filter((row) => row.value.startsWith('{') && row.value.endsWith('}'));
const aliasTargets = new Set(aliasRows.map((row) => row.value.slice(1, -1)));
const missingAliasTargets = [...aliasTargets].filter((target) => !variables.includes(target));
const valueMismatches = rows.filter((row) => {
  if (row.value.startsWith('{') && row.value.endsWith('}')) return false;
  return normalizeValue(templateValues.get(row.token)) !== normalizeValue(row.value);
});

printSummary();

let failed = false;

if (missingFromSpec.length > 0) {
  failed = true;
  printList('Missing from Figma spec', missingFromSpec);
}

if (extraInSpec.length > 0) {
  failed = true;
  printList('Extra in Figma spec', extraInSpec);
}

if (duplicatedSpecTokens.length > 0) {
  failed = true;
  printList('Duplicate CSS tokens in Figma spec', duplicatedSpecTokens);
}

if (duplicatedVariables.length > 0) {
  failed = true;
  printList('Duplicate Figma variables in spec', duplicatedVariables);
}

if (missingAliasTargets.length > 0) {
  failed = true;
  printList('Alias targets missing from spec', missingAliasTargets);
}

if (valueMismatches.length > 0) {
  failed = true;
  console.log('\nDefault value mismatches:');
  for (const row of valueMismatches) {
    console.log(`  - ${row.token}`);
    console.log(`    template: ${templateValues.get(row.token) ?? '<missing>'}`);
    console.log(`    spec:     ${row.value}`);
  }
}

if (failed) process.exitCode = 1;

function unique(values) {
  return [...new Set(values)].sort();
}

function duplicates(values) {
  const seen = new Set();
  const out = new Set();
  for (const value of values) {
    if (seen.has(value)) out.add(value);
    seen.add(value);
  }
  return [...out].sort();
}

function parseTemplateValues(css) {
  const values = new Map();
  const pattern = /\/\*\s*(--[a-z0-9-]+)\s*:\s*([^;]+);\s*(?:\[TW\])?\s*\*\//g;
  for (const [, token, value] of css.matchAll(pattern)) values.set(token, value.trim());
  return values;
}

function normalizeValue(value) {
  if (!value) return value;
  return value
    .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, '$1')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanCellValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) return trimmed.slice(1, -1).trim();
  return trimmed;
}

function printSummary() {
  console.log('Figma token kit validation');
  console.log(`Template: ${relative(root, templatePath)} (${templateTokens.length} tokens)`);
  console.log(`Spec:     ${relative(root, specPath)} (${specTokens.length} CSS tokens, ${variables.length} variables)`);
  console.log(`Aliases:  ${aliasRows.length}`);
}

function printList(title, values) {
  console.log(`\n${title}:`);
  for (const value of values) console.log(`  - ${value}`);
}
