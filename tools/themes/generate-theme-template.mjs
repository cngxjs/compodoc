import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mergeThemeTokens, readBadgeFallbackTokens, readCanonicalTheme, readModifierFallbackTokens } from './theme-token-utils.mjs';

const root = resolve(import.meta.dirname, '../..');
const sourcePath = resolve(root, 'src/styles/compodocx.css');
const badgePath = resolve(root, 'src/styles/components/badges.css');
const memberCardPath = resolve(root, 'src/styles/components/member-card.css');
const templatePath = resolve(root, 'src/themes/theme-template.css');
const mode = process.argv.includes('--check') ? 'check' : 'write';

const { light, dark } = readCanonicalTheme(sourcePath);
const fallbackTokens = [...readBadgeFallbackTokens(badgePath), ...readModifierFallbackTokens(memberCardPath)];
const generated = generateTemplate({ light: mergeThemeTokens(light, fallbackTokens), dark });

if (mode === 'check') {
  const current = readFileSync(templatePath, 'utf8');
  if (current !== generated) {
    console.error('src/themes/theme-template.css is stale. Run npm run generate:theme-template.');
    process.exit(1);
  }
  console.log('src/themes/theme-template.css is up to date');
} else {
  writeFileSync(templatePath, generated);
  console.log(`Wrote src/themes/theme-template.css (${light.length + fallbackTokens.length} light tokens, ${dark.length} dark overrides)`);
}

function generateTemplate({ light, dark }) {
  return `/* @theme My Theme Name
 *
 * Generated from src/styles/compodocx.css.
 * Do not edit by hand; run npm run generate:theme-template.
 *
 * Custom theme for compodocx.
 * Uncomment and override any subset of tokens below; unspecified tokens fall
 * back to the built-in defaults.
 *
 * Both :root (light) and .dark blocks are supported. If .dark is omitted,
 * :root values are used in both modes.
 *
 * Usage: compodocx --theme ./my-theme.css
 * Pairs well with: --shikiTheme github-light:github-dark
 */

:root {
${commentedDeclarations(light)}
}

.dark {
  /* Override only tokens that should differ in dark mode. */
${commentedDeclarations(dark)}
}
`;
}

function commentedDeclarations(tokens) {
  const maxLength = Math.max(...tokens.map((entry) => entry.token.length));
  return tokens.map((entry) => `  /* ${entry.token.padEnd(maxLength)}: ${entry.value}; */`).join('\n');
}
