import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mergeThemeTokens, readBadgeFallbackTokens, readCanonicalTheme, readModifierFallbackTokens, tokensToMap } from '../themes/theme-token-utils.mjs';

const root = resolve(import.meta.dirname, '../..');
const docPath = resolve(root, 'docs/figma-design-token-kit.md');
const canonicalPath = resolve(root, 'src/styles/compodocx.css');
const badgePath = resolve(root, 'src/styles/components/badges.css');
const memberCardPath = resolve(root, 'src/styles/components/member-card.css');
const mode = process.argv.includes('--check') ? 'check' : 'write';

const groups = [
  {
    title: 'Surface',
    tokens: [
      ['surface/bg', '--color-cdx-bg'],
      ['surface/bg-alt', '--color-cdx-bg-alt'],
      ['surface/elevated', '--color-cdx-bg-elevated'],
      ['surface/code', '--color-cdx-bg-code'],
      ['surface/code-block', '--color-cdx-bg-code-block'],
    ],
  },
  {
    title: 'Text',
    tokens: [
      ['text/default', '--color-cdx-text'],
      ['text/secondary', '--color-cdx-text-secondary'],
      ['text/muted', '--color-cdx-text-muted'],
      ['text/inverse', '--color-cdx-text-inverse'],
    ],
  },
  {
    title: 'Primary',
    tokens: [
      ['primary/default', '--color-cdx-primary'],
      ['primary/hover', '--color-cdx-primary-hover'],
      ['primary/subtle', '--color-cdx-primary-subtle'],
    ],
  },
  {
    title: 'Entity Accents',
    tokens: [
      ['entity/component', '--color-cdx-entity-component'],
      ['entity/service', '--color-cdx-entity-service'],
      ['entity/directive', '--color-cdx-entity-directive'],
      ['entity/pipe', '--color-cdx-entity-pipe'],
      ['entity/module', '--color-cdx-entity-module'],
      ['entity/class', '--color-cdx-entity-class'],
      ['entity/interface', '--color-cdx-entity-interface'],
      ['entity/guard', '--color-cdx-entity-guard'],
      ['entity/interceptor', '--color-cdx-entity-interceptor'],
      ['entity/function', '--color-cdx-entity-function'],
      ['entity/variable', '--color-cdx-entity-variable'],
      ['entity/typealias', '--color-cdx-entity-typealias'],
      ['entity/enum', '--color-cdx-entity-enum'],
    ],
  },
  {
    title: 'Badge Base Colors',
    note: 'Badge text, borders, and fills are derived in CSS with `color-mix()`. Model only the base color in Figma.',
    tokens: [
      ['badge/standalone', '--color-cdx-badge-standalone'],
      ['badge/token', '--color-cdx-badge-token'],
      ['badge/beta', '--color-cdx-badge-beta'],
      ['badge/factory', '--color-cdx-badge-factory'],
      ['badge/zoneless', '--color-cdx-badge-zoneless'],
      ['badge/breaking', '--color-cdx-badge-breaking'],
      ['badge/signal', '--color-cdx-badge-signal'],
      ['badge/computed', '--color-cdx-badge-computed'],
      ['badge/effect', '--color-cdx-badge-effect'],
      ['badge/resource', '--color-cdx-badge-resource'],
      ['badge/model', '--color-cdx-badge-model'],
      ['badge/after-render', '--color-cdx-badge-after-render'],
      ['badge/after-next-render', '--color-cdx-badge-after-next-render'],
      ['badge/after-every-render', '--color-cdx-badge-after-every-render'],
      ['badge/after-render-effect', '--color-cdx-badge-after-render-effect'],
      ['badge/input', '--color-cdx-badge-input'],
      ['badge/output', '--color-cdx-badge-output'],
      ['badge/view-child', '--color-cdx-badge-view-child'],
      ['badge/content-child', '--color-cdx-badge-content-child'],
      ['badge/inject', '--color-cdx-badge-inject'],
      ['badge/host', '--color-cdx-badge-host'],
    ],
  },
  {
    title: 'Modifier Base Colors',
    tokens: [
      ['modifier/private', '--color-cdx-mod-private'],
      ['modifier/protected', '--color-cdx-mod-protected'],
      ['modifier/readonly', '--color-cdx-mod-readonly'],
      ['modifier/static', '--color-cdx-mod-static'],
      ['modifier/async', '--color-cdx-mod-async'],
    ],
  },
  {
    title: 'Feedback',
    tokens: [
      ['status/pass', '--color-cdx-status-pass'],
      ['status/fail', '--color-cdx-status-fail'],
      ['status/warning', '--color-cdx-status-warning'],
      ['overlay/default', '--color-cdx-overlay'],
      ['feedback/deprecated', '--color-cdx-deprecated'],
      ['feedback/danger', '--color-cdx-danger'],
    ],
  },
  {
    title: 'Borders And Shadows',
    tokens: [
      ['border/default', '--color-cdx-border'],
      ['border/strong', '--color-cdx-border-strong'],
      ['border/focus', '--color-cdx-border-focus'],
      ['shadow/sm', '--shadow-cdx-sm'],
      ['shadow/md', '--shadow-cdx-md'],
      ['shadow/lg', '--shadow-cdx-lg'],
    ],
  },
  {
    title: 'Typography',
    tokens: [
      ['font/heading', '--font-heading'],
      ['font/body', '--font-body'],
      ['font/code', '--font-code'],
      ['font/sans', '--font-sans'],
      ['font/mono', '--font-mono'],
    ],
  },
  {
    title: 'Radii And Spacing',
    tokens: [
      ['radius/sm', '--radius-cdx-sm'],
      ['radius/md', '--radius-cdx-md'],
      ['radius/lg', '--radius-cdx-lg'],
      ['radius/tw-sm', '--radius-sm'],
      ['radius/tw-md', '--radius-md'],
      ['radius/tw-lg', '--radius-lg'],
      ['radius/tw-2xl', '--radius-2xl'],
      ['density/default', '--cdx-density'],
      ['spacing/xs', '--spacing-cdx-xs'],
      ['spacing/sm', '--spacing-cdx-sm'],
      ['spacing/md', '--spacing-cdx-md'],
      ['spacing/lg', '--spacing-cdx-lg'],
      ['spacing/xl', '--spacing-cdx-xl'],
      ['spacing/2xl', '--spacing-cdx-2xl'],
      ['spacing/sidebar', '--spacing-cdx-sidebar'],
    ],
  },
  {
    title: 'Code And Graphs',
    tokens: [
      ['code/snippet-bg', '--color-cdx-snippet-bg'],
      ['code/snippet-border', '--color-cdx-snippet-border'],
      ['code/snippet-radius', '--color-cdx-snippet-radius'],
      ['code/inline', '--color-cdx-code-inline'],
      ['code/dark-surface', '--color-cdx-code-dark-surface'],
      ['code/scrollbar', '--color-cdx-scrollbar'],
      ['code/line-number', '--color-cdx-line-number'],
      ['code/line-hover', '--color-cdx-line-hover'],
      ['code/line-highlight', '--color-cdx-line-highlight'],
      ['code/line-highlight-flash', '--color-cdx-line-highlight-flash'],
      ['code/copy-success', '--color-cdx-copy-success'],
      ['code/lang-chip', '--color-cdx-lang-chip'],
      ['code/lang-chip-bg', '--color-cdx-lang-chip-bg'],
      ['graph/bg', '--color-cdx-graph-bg'],
      ['graph/border', '--color-cdx-graph-border'],
      ['graph/border-width', '--color-cdx-graph-border-width'],
      ['graph/radius', '--color-cdx-graph-radius'],
      ['transition/fast', '--cdx-transition-fast'],
      ['transition/base', '--cdx-transition-base'],
    ],
  },
];

const { light } = readCanonicalTheme(canonicalPath);
const canonicalTokens = mergeThemeTokens(light, [...readBadgeFallbackTokens(badgePath), ...readModifierFallbackTokens(memberCardPath)]);
const values = tokensToMap(canonicalTokens);
const current = readFileSync(docPath, 'utf8');
const generated = replaceVariableSection(current, renderVariableSection());

if (mode === 'check') {
  if (current !== generated) {
    console.error('docs/figma-design-token-kit.md is stale. Run npm run generate:figma-kit-doc.');
    process.exit(1);
  }
  console.log('docs/figma-design-token-kit.md is up to date');
} else {
  writeFileSync(docPath, generated);
  console.log(`Wrote docs/figma-design-token-kit.md (${canonicalTokens.length} variables)`);
}

function replaceVariableSection(markdown, section) {
  const start = markdown.indexOf('### Surface');
  const end = markdown.indexOf('## Components Page');
  if (start === -1 || end === -1 || end <= start) throw new Error('Could not locate Figma variable section');
  return `${markdown.slice(0, start)}${section}\n\n${markdown.slice(end)}`;
}

function renderVariableSection() {
  return groups
    .map((group) => {
      const note = group.note ? `\n\n${group.note}` : '';
      const rows = group.tokens.map(([variable, token]) => `| \`${variable}\` | \`${valueFor(token)}\` | \`${token}\` |`).join('\n');
      return `### ${group.title}${note}\n\n| Variable | Light value | CSS token |\n|-|-|-|\n${rows}`;
    })
    .join('\n\n');
}

function valueFor(token) {
  const value = values.get(token);
  if (value === undefined) throw new Error(`Missing canonical value for ${token}`);
  return value;
}
