export const quotedFontFamilies = new Set(['Instrument Sans', 'Source Sans 3', 'Cascadia Code', 'SF Mono']);

export function cleanCellValue(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) return trimmed.slice(1, -1).trim();
  return trimmed;
}

export function parseSpecRows(spec) {
  return [...spec.matchAll(/^\| `([^`]+)` \| ([^|]+) \| `(--[a-z0-9-]+)` \|$/gm)].map(
    ([, variable, value, token]) => ({ variable, value: cleanCellValue(value), token }),
  );
}

export function cssTokenFromDescription(description) {
  return description.match(/--[a-z0-9-]+/)?.[0];
}

export function cssValueFromFigmaValue(value, tokenByVariable) {
  if (value && typeof value === 'object' && 'alias' in value) {
    const token = tokenByVariable.get(value.alias);
    if (!token) throw new Error(`Unknown Figma alias target: ${value.alias}`);
    return `var(${token})`;
  }
  if (typeof value === 'number') return `${value}px`;
  if (typeof value !== 'string') return String(value);
  return quoteFontFamilies(value);
}

export function cssValueFromSpecValue(value, tokenByVariable) {
  if (!value.startsWith('{') || !value.endsWith('}')) return quoteFontFamilies(value);
  const variable = value.slice(1, -1);
  const token = tokenByVariable.get(variable);
  if (!token) throw new Error(`Unknown alias target: ${variable}`);
  return `var(${token})`;
}

export function quoteFontFamilies(value) {
  return value
    .split(',')
    .map((part) => {
      const family = part.trim();
      if (quotedFontFamilies.has(family)) return `"${family}"`;
      return family;
    })
    .join(', ');
}

export function normalizeCssValue(value) {
  if (!value) return value;
  const normalized = String(value)
    .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, '$1')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/\b0(?:px|rem|em)\b/g, '0')
    .trim();

  return normalizeColorValue(normalized) ?? normalized;
}

function normalizeColorValue(value) {
  const rgba = parseCssColor(value);
  if (!rgba) return null;
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${formatAlpha(rgba.a)})`;
}

function parseCssColor(value) {
  if (value.toLowerCase() === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const raw = hex[1].length === 3 ? hex[1].replace(/[\da-f]/gi, (digit) => digit + digit) : hex[1];
    return {
      r: Number.parseInt(raw.slice(0, 2), 16),
      g: Number.parseInt(raw.slice(2, 4), 16),
      b: Number.parseInt(raw.slice(4, 6), 16),
      a: 1,
    };
  }

  const rgba = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const parts = rgba[1].split(',').map((part) => part.trim());
    if (parts.length < 3 || parts.length > 4) return null;
    return {
      r: clampByte(Number(parts[0])),
      g: clampByte(Number(parts[1])),
      b: clampByte(Number(parts[2])),
      a: parts[3] === undefined ? 1 : clampAlpha(Number(parts[3])),
    };
  }

  const hsl = value.match(/^hsl\(([-\d.]+)\s+([-\d.]+)%\s+([-\d.]+)%(?:\s*\/\s*([-\d.]+))?\)$/i);
  if (!hsl) return null;
  return hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]), hsl[4] === undefined ? 1 : Number(hsl[4]));
}

function hslToRgb(hue, saturation, lightness, alpha) {
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = clampUnit(saturation / 100);
  const l = clampUnit(lightness / 100);
  if (s === 0) {
    const gray = clampByte(l * 255);
    return { r: gray, g: gray, b: gray, a: clampAlpha(alpha) };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: clampByte(hueToRgb(p, q, h + 1 / 3) * 255),
    g: clampByte(hueToRgb(p, q, h) * 255),
    b: clampByte(hueToRgb(p, q, h - 1 / 3) * 255),
    a: clampAlpha(alpha),
  };
}

function hueToRgb(p, q, t) {
  let adjusted = t;
  if (adjusted < 0) adjusted += 1;
  if (adjusted > 1) adjusted -= 1;
  if (adjusted < 1 / 6) return p + (q - p) * 6 * adjusted;
  if (adjusted < 1 / 2) return q;
  if (adjusted < 2 / 3) return p + (q - p) * (2 / 3 - adjusted) * 6;
  return p;
}

function clampByte(value) {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function clampUnit(value) {
  return Math.min(1, Math.max(0, value));
}

function clampAlpha(value) {
  return Math.min(1, Math.max(0, value));
}

function formatAlpha(value) {
  return Number(value.toFixed(4)).toString();
}
