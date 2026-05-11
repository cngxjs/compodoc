import { readFileSync } from 'node:fs';

export function readCanonicalTheme(cssPath) {
  const css = readFileSync(cssPath, 'utf8');
  const light = parseDeclarations(extractBlock(css, /@theme\s*\{/));
  const dark = parseDeclarations(extractBlock(css, /\.dark\s*\{/));
  return { light, dark };
}

export function readBadgeFallbackTokens(cssPath) {
  return readFallbackTokens(cssPath, /--cdx-badge-base:\s*var\((--color-cdx-badge-[a-z0-9-]+),\s*([^;]+)\);/g);
}

export function readModifierFallbackTokens(cssPath) {
  return readFallbackTokens(cssPath, /--cdx-mod-base:\s*var\((--color-cdx-mod-[a-z0-9-]+),\s*([^;]+)\);/g);
}

function readFallbackTokens(cssPath, pattern) {
  const css = readFileSync(cssPath, 'utf8');
  const tokens = [];
  const seen = new Set();
  for (const match of css.matchAll(pattern)) {
    const token = match[1];
    if (seen.has(token)) continue;
    seen.add(token);
    tokens.push({ token, value: match[2].trim() });
  }
  return tokens;
}

export function mergeThemeTokens(light, extraTokens) {
  const merged = [...light];
  const existing = new Set(light.map((entry) => entry.token));
  for (const entry of extraTokens) {
    if (!existing.has(entry.token)) merged.push(entry);
  }
  return merged;
}

export function tokensToMap(tokens) {
  return new Map(tokens.map((entry) => [entry.token, entry.value]));
}

function extractBlock(css, pattern) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const match = stripped.match(pattern);
  if (!match || match.index === undefined) return '';

  const start = stripped.indexOf('{', match.index);
  let depth = 0;
  for (let i = start; i < stripped.length; i += 1) {
    if (stripped[i] === '{') depth += 1;
    if (stripped[i] !== '}') continue;
    depth -= 1;
    if (depth === 0) return stripped.slice(start + 1, i);
  }
  throw new Error('Unbalanced CSS block');
}

function parseDeclarations(block) {
  const declarations = [];
  const pattern = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
  for (const match of block.matchAll(pattern)) {
    declarations.push({ token: match[1], value: match[2].replace(/\s+/g, ' ').trim() });
  }
  return declarations;
}
