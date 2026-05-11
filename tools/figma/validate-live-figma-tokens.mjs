import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { mergeThemeTokens, readBadgeFallbackTokens, readCanonicalTheme, readModifierFallbackTokens, tokensToMap } from '../themes/theme-token-utils.mjs';
import {
  cssTokenFromDescription,
  cssValueFromFigmaValue,
  normalizeCssValue,
  parseSpecRows,
} from './figma-token-utils.mjs';

const root = resolve(import.meta.dirname, '../..');
const canonicalPath = resolve(root, 'src/styles/compodocx.css');
const badgePath = resolve(root, 'src/styles/components/badges.css');
const memberCardPath = resolve(root, 'src/styles/components/member-card.css');
const specPath = resolve(root, 'docs/figma-design-token-kit.md');
const livePath = resolve(root, process.argv[2] ?? 'tmp/figma-live-variables.json');

const spec = readFileSync(specPath, 'utf8');
const live = JSON.parse(readFileSync(livePath, 'utf8'));
const specRows = parseSpecRows(spec);
const specByVariable = new Map(specRows.map((row) => [row.variable, row]));
const tokenByVariable = new Map(specRows.map((row) => [row.variable, row.token]));
const { light, dark } = readCanonicalTheme(canonicalPath);
const canonicalLight = mergeThemeTokens(light, [...readBadgeFallbackTokens(badgePath), ...readModifierFallbackTokens(memberCardPath)]);
const lightByToken = tokensToMap(canonicalLight);
const darkByToken = tokensToMap(dark);
const liveByVariable = new Map(live.variables.map((variable) => [variable.name, variable]));

let failed = false;
const missing = specRows.map((row) => row.variable).filter((variable) => !liveByVariable.has(variable));
const extra = live.variables.map((variable) => variable.name).filter((variable) => !specByVariable.has(variable));
const descriptionMismatches = [];
const lightValueMismatches = [];
const darkValueMismatches = [];
const missingDarkValues = [];

for (const row of specRows) {
  const liveVariable = liveByVariable.get(row.variable);
  if (!liveVariable) continue;

  const cssToken = cssTokenFromDescription(liveVariable.description ?? '');
  if (cssToken !== row.token) descriptionMismatches.push({ variable: row.variable, expected: row.token, actual: cssToken ?? '<missing>' });

  const expectedLight = lightByToken.get(row.token);
  const actualLight = cssValueFromFigmaValue(liveVariable.values?.Light, tokenByVariable);
  if (normalizeCssValue(expectedLight) !== normalizeCssValue(actualLight)) {
    lightValueMismatches.push({ variable: row.variable, token: row.token, expected: expectedLight, actual: actualLight });
  }

  if (!('Dark' in (liveVariable.values ?? {}))) {
    missingDarkValues.push(row.variable);
    continue;
  }

  const expectedDark = darkByToken.get(row.token) ?? expectedLight;
  const actualDark = cssValueFromFigmaValue(liveVariable.values?.Dark, tokenByVariable);
  if (normalizeCssValue(expectedDark) !== normalizeCssValue(actualDark)) {
    darkValueMismatches.push({ variable: row.variable, token: row.token, expected: expectedDark, actual: actualDark });
  }
}

console.log('Live Figma token validation');
console.log(`Source: ${relative(root, canonicalPath)} (${canonicalLight.length} light tokens, ${dark.length} dark overrides)`);
console.log(`Spec:   ${relative(root, specPath)} (${specRows.length} variables)`);
console.log(`Live: ${relative(root, livePath)} (${live.variables.length} variables)`);
console.log(`Collection: ${live.collection}`);
console.log(`Modes: ${live.modes.join(', ')}`);

failed = reportList('Missing in live Figma', missing) || failed;
failed = reportList('Extra in live Figma', extra) || failed;
failed = reportObjects('Description CSS token mismatches', descriptionMismatches) || failed;
failed = reportObjects('Light value mismatches', lightValueMismatches) || failed;
failed = reportObjects('Dark value mismatches', darkValueMismatches) || failed;
failed = reportList('Missing dark-mode values', missingDarkValues) || failed;

if (failed) process.exitCode = 1;

function reportList(title, values) {
  if (values.length === 0) return false;
  console.log(`\n${title}:`);
  for (const value of values) console.log(`  - ${value}`);
  return true;
}

function reportObjects(title, values) {
  if (values.length === 0) return false;
  console.log(`\n${title}:`);
  for (const value of values) {
    console.log(`  - ${value.variable}${value.token ? ` (${value.token})` : ''}`);
    console.log(`    expected: ${value.expected}`);
    console.log(`    actual:   ${value.actual}`);
  }
  return true;
}
