const pages = {
  cover: 'Cover',
  tokens: 'Tokens',
  components: 'Components',
};

const colors = {
  bg: '#f8f9fb',
  bgAlt: '#f2f4f7',
  elevated: '#ffffff',
  text: '#1d2430',
  secondary: '#626f81',
  muted: '#6b7280',
  primary: '#2f63df',
  primaryHover: '#2550b9',
  primarySubtle: '#eef4ff',
  border: '#e1e5eb',
  codeDark: '#1f2433',
  pass: '#16a34a',
  fail: '#ef4444',
  warning: '#ca8a04',
};

const entityTokens = [
  ['entity/component', '#0e8578', '--color-cdx-entity-component'],
  ['entity/service', '#a56a07', '--color-cdx-entity-service'],
  ['entity/directive', '#7c3aed', '--color-cdx-entity-directive'],
  ['entity/pipe', '#e2177b', '--color-cdx-entity-pipe'],
  ['entity/module', '#1e6ff5', '--color-cdx-entity-module'],
  ['entity/class', '#05875f', '--color-cdx-entity-class'],
  ['entity/interface', '#475569', '--color-cdx-entity-interface'],
  ['entity/guard', '#eb1515', '--color-cdx-entity-guard'],
  ['entity/interceptor', '#ba25cd', '--color-cdx-entity-interceptor'],
  ['entity/function', '#52840b', '--color-cdx-entity-function'],
  ['entity/variable', '#617087', '--color-cdx-entity-variable'],
  ['entity/typealias', '#6164f1', '--color-cdx-entity-typealias'],
  ['entity/enum', '#c2410c', '--color-cdx-entity-enum'],
];

const badgeTokens = [
  ['badge/standalone', '#2b9684', '--color-cdx-badge-standalone'],
  ['badge/token', '#7543b8', '--color-cdx-badge-token'],
  ['badge/beta', '#bc751b', '--color-cdx-badge-beta'],
  ['badge/factory', '#367c9f', '--color-cdx-badge-factory'],
  ['badge/zoneless', '#8b45b0', '--color-cdx-badge-zoneless'],
  ['badge/breaking', '#bd2828', '--color-cdx-badge-breaking'],
  ['badge/signal', '#2b6fad', '--color-cdx-badge-signal'],
  ['badge/computed', '#7242ac', '--color-cdx-badge-computed'],
  ['badge/effect', '#ad841f', '--color-cdx-badge-effect'],
  ['badge/resource', '#2c8795', '--color-cdx-badge-resource'],
  ['badge/model', '#4747a8', '--color-cdx-badge-model'],
  ['badge/input', '#2d864c', '--color-cdx-badge-input'],
  ['badge/output', '#a9364b', '--color-cdx-badge-output'],
  ['badge/inject', '#a64087', '--color-cdx-badge-inject'],
  ['badge/host', '#2d8989', '--color-cdx-badge-host'],
];

const tokenGroups = [
  {
    title: 'Surface',
    tokens: [
      ['surface/bg', colors.bg, '--color-cdx-bg'],
      ['surface/bg-alt', colors.bgAlt, '--color-cdx-bg-alt'],
      ['surface/elevated', colors.elevated, '--color-cdx-bg-elevated'],
      ['surface/code', '#eef1f5', '--color-cdx-bg-code'],
      ['surface/code-block', colors.codeDark, '--color-cdx-bg-code-block'],
    ],
  },
  {
    title: 'Text',
    tokens: [
      ['text/default', colors.text, '--color-cdx-text'],
      ['text/secondary', colors.secondary, '--color-cdx-text-secondary'],
      ['text/muted', colors.muted, '--color-cdx-text-muted'],
      ['text/inverse', '#f2f4f7', '--color-cdx-text-inverse'],
    ],
  },
  {
    title: 'Primary',
    tokens: [
      ['primary/default', colors.primary, '--color-cdx-primary'],
      ['primary/hover', colors.primaryHover, '--color-cdx-primary-hover'],
      ['primary/subtle', colors.primarySubtle, '--color-cdx-primary-subtle'],
    ],
  },
  { title: 'Entity Accents', tokens: entityTokens },
  { title: 'Badge Base Colors', tokens: badgeTokens },
  {
    title: 'Feedback',
    tokens: [
      ['status/pass', colors.pass, '--color-cdx-status-pass'],
      ['status/fail', colors.fail, '--color-cdx-status-fail'],
      ['status/warning', colors.warning, '--color-cdx-status-warning'],
      ['feedback/danger', '#dc2626', '--color-cdx-danger'],
      ['feedback/deprecated', '#a16207', '--color-cdx-deprecated'],
    ],
  },
];

function hexToPaint(hex) {
  const clean = hex.replace('#', '');
  const r = Number.parseInt(clean.slice(0, 2), 16) / 255;
  const g = Number.parseInt(clean.slice(2, 4), 16) / 255;
  const b = Number.parseInt(clean.slice(4, 6), 16) / 255;
  return { type: 'SOLID', color: { r, g, b } };
}

function textNode(content, size = 16, color = colors.text, weight = 'Regular') {
  const node = figma.createText();
  node.characters = content;
  node.fontSize = size;
  node.fills = [hexToPaint(color)];
  node.fontName = { family: 'Inter', style: weight };
  return node;
}

function frame(name, width, height, fill = colors.elevated) {
  const node = figma.createFrame();
  node.name = name;
  node.resize(width, height);
  node.fills = [hexToPaint(fill)];
  node.clipsContent = false;
  return node;
}

function autoLayout(node, direction = 'VERTICAL', gap = 16, padding = 24) {
  node.layoutMode = direction;
  node.itemSpacing = gap;
  node.paddingTop = padding;
  node.paddingRight = padding;
  node.paddingBottom = padding;
  node.paddingLeft = padding;
}

function rounded(node, radius = 16) {
  node.cornerRadius = radius;
}

function stroke(node, color = colors.border) {
  node.strokes = [hexToPaint(color)];
  node.strokeWeight = 1;
}

function getOrCreatePage(name) {
  const existing = figma.root.children.find((page) => page.name === name);
  if (existing) return existing;
  const page = figma.createPage();
  page.name = name;
  return page;
}

function clearPage(page) {
  for (const child of [...page.children]) child.remove();
}

async function loadFonts() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
}

function chip(label, fill = colors.primarySubtle, text = colors.primary) {
  const node = frame(`Chip / ${label}`, 10, 10, fill);
  autoLayout(node, 'HORIZONTAL', 8, 10);
  rounded(node, 999);
  node.appendChild(textNode(label, 14, text, 'Medium'));
  node.layoutSizingHorizontal = 'HUG';
  node.layoutSizingVertical = 'HUG';
  return node;
}

function swatch(name, value, cssToken) {
  const row = frame(`Token / ${name}`, 320, 72, colors.elevated);
  autoLayout(row, 'HORIZONTAL', 14, 12);
  rounded(row, 12);
  stroke(row);

  const color = frame('Swatch', 44, 44, value);
  rounded(color, 10);
  stroke(color, '#d6dbe3');

  const labels = frame('Labels', 220, 48, colors.elevated);
  labels.fills = [];
  autoLayout(labels, 'VERTICAL', 4, 0);
  labels.appendChild(textNode(name, 14, colors.text, 'Medium'));
  labels.appendChild(textNode(cssToken, 11, colors.secondary));

  row.appendChild(color);
  row.appendChild(labels);
  return row;
}

function populateCover(page) {
  clearPage(page);
  const root = frame('Cover / 1440', 1440, 960, colors.bg);
  root.x = 0;
  root.y = 0;
  autoLayout(root, 'VERTICAL', 32, 80);

  const hero = frame('Hero / Design Token Kit', 1120, 640, colors.elevated);
  autoLayout(hero, 'VERTICAL', 28, 56);
  rounded(hero, 32);
  stroke(hero);
  hero.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.13, b: 0.18, a: 0.12 }, offset: { x: 0, y: 24 }, radius: 60, spread: -20, visible: true, blendMode: 'NORMAL' }];

  hero.appendChild(textNode('compodocx Design Token Kit', 72, colors.text, 'Bold'));
  hero.appendChild(textNode('Design a docs theme in Figma, export the same decisions as CSS custom properties, and ship it with compodocx --theme.', 24, colors.secondary));

  const chips = frame('Theme Workflow Chips', 10, 10, colors.elevated);
  chips.fills = [];
  autoLayout(chips, 'HORIZONTAL', 12, 0);
  chips.appendChild(chip('--theme my-brand.css'));
  chips.appendChild(chip('--color-cdx-*'));
  chips.appendChild(chip('Light + Dark modes'));
  chips.appendChild(chip('Angular docs UI'));

  const strip = frame('Token Preview Strip', 10, 10, colors.elevated);
  strip.fills = [];
  autoLayout(strip, 'HORIZONTAL', 10, 0);
  for (const [, value] of [...tokenGroups[0].tokens, ...tokenGroups[2].tokens, ...entityTokens.slice(0, 5)]) {
    const dot = frame('Preview Color', 48, 48, value);
    rounded(dot, 999);
    stroke(dot, '#d6dbe3');
    strip.appendChild(dot);
  }

  hero.appendChild(chips);
  hero.appendChild(strip);
  hero.appendChild(textNode('Docs: https://compodocx.dev/guides/themes/   Template CSS: src/themes/theme-template.css', 16, colors.muted));
  root.appendChild(hero);
  page.appendChild(root);
}

function populateTokens(page) {
  clearPage(page);
  const root = frame('Tokens / compodocx variables', 1440, 2200, colors.bg);
  autoLayout(root, 'VERTICAL', 28, 64);
  root.appendChild(textNode('Tokens', 56, colors.text, 'Bold'));
  root.appendChild(textNode('Figma variables grouped to match compodocx CSS custom properties. Use these names as design aliases; export the CSS token names shown on each row.', 20, colors.secondary));

  const grid = frame('Token Groups', 10, 10, colors.bg);
  grid.fills = [];
  autoLayout(grid, 'VERTICAL', 24, 0);

  for (const group of tokenGroups) {
    const section = frame(`Group / ${group.title}`, 1120, 10, colors.elevated);
    autoLayout(section, 'VERTICAL', 16, 24);
    rounded(section, 20);
    stroke(section);
    section.appendChild(textNode(group.title, 28, colors.text, 'Bold'));

    const rows = frame(`Rows / ${group.title}`, 10, 10, colors.elevated);
    rows.fills = [];
    autoLayout(rows, 'HORIZONTAL', 12, 0);
    rows.layoutWrap = 'WRAP';
    rows.counterAxisSpacing = 12;
    for (const token of group.tokens) rows.appendChild(swatch(token[0], token[1], token[2]));
    section.appendChild(rows);
    grid.appendChild(section);
  }

  root.appendChild(grid);
  page.appendChild(root);
}

function badge(label, color) {
  const node = frame(`Badge / ${label}`, 10, 10, '#ffffff');
  autoLayout(node, 'HORIZONTAL', 8, 8);
  rounded(node, 999);
  node.fills = [{ type: 'SOLID', color: hexToPaint(color).color, opacity: 0.12 }];
  node.strokes = [{ type: 'SOLID', color: hexToPaint(color).color, opacity: 0.35 }];
  node.appendChild(textNode(label, 13, color, 'Medium'));
  node.layoutSizingHorizontal = 'HUG';
  node.layoutSizingVertical = 'HUG';
  return node;
}

function button(label, variant) {
  const fill = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.primarySubtle : colors.elevated;
  const text = variant === 'primary' ? '#ffffff' : colors.primary;
  const node = frame(`Button / ${label}`, 10, 10, fill);
  autoLayout(node, 'HORIZONTAL', 8, 12);
  rounded(node, 10);
  if (variant !== 'primary') stroke(node, colors.border);
  node.appendChild(textNode(label, 15, text, 'Medium'));
  node.layoutSizingHorizontal = 'HUG';
  node.layoutSizingVertical = 'HUG';
  return node;
}

function populateComponents(page) {
  clearPage(page);
  const root = frame('Components / theme examples', 1440, 1400, colors.bg);
  autoLayout(root, 'VERTICAL', 32, 64);
  root.appendChild(textNode('Components', 56, colors.text, 'Bold'));
  root.appendChild(textNode('Small examples that prove a theme works across docs surfaces, badges, entity labels, callouts, and code blocks.', 20, colors.secondary));

  const card = frame('Docs Preview Card', 1120, 620, colors.elevated);
  autoLayout(card, 'VERTICAL', 24, 32);
  rounded(card, 24);
  stroke(card);
  card.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.13, b: 0.18, a: 0.08 }, offset: { x: 0, y: 12 }, radius: 32, spread: -12, visible: true, blendMode: 'NORMAL' }];

  card.appendChild(textNode('SignalCardComponent', 36, colors.text, 'Bold'));
  card.appendChild(textNode('Standalone Angular component with signal inputs, computed state, inject(), host metadata, and theme tokens.', 18, colors.secondary));

  const actions = frame('Actions', 10, 10, colors.elevated);
  actions.fills = [];
  autoLayout(actions, 'HORIZONTAL', 12, 0);
  actions.appendChild(button('View API', 'primary'));
  actions.appendChild(button('Open Playground', 'secondary'));
  actions.appendChild(button('Copy install command', 'ghost'));
  card.appendChild(actions);

  const badges = frame('Badges', 10, 10, colors.elevated);
  badges.fills = [];
  autoLayout(badges, 'HORIZONTAL', 10, 0);
  for (const [label, color] of [
    ['standalone', '#2b9684'],
    ['signal', '#2b6fad'],
    ['computed', '#7242ac'],
    ['inject', '#a64087'],
    ['host', '#2d8989'],
  ]) badges.appendChild(badge(label, color));
  card.appendChild(badges);

  const code = frame('Code Snippet', 900, 220, colors.codeDark);
  autoLayout(code, 'VERTICAL', 8, 24);
  rounded(code, 16);
  code.appendChild(textNode("@Component({ selector: 'app-signal-card', standalone: true })", 16, '#dbe7ff'));
  code.appendChild(textNode('export class SignalCardComponent {', 16, '#dbe7ff'));
  code.appendChild(textNode("  readonly title = input.required<string>();", 16, '#9dd6ff'));
  code.appendChild(textNode('  readonly theme = inject(ThemeService);', 16, '#f5c2e7'));
  code.appendChild(textNode('}', 16, '#dbe7ff'));
  card.appendChild(code);

  const callouts = frame('Callouts', 1120, 220, colors.bg);
  callouts.fills = [];
  autoLayout(callouts, 'HORIZONTAL', 16, 0);
  for (const [title, body, color] of [
    ['Info', 'Use CSS variables to theme generated docs.', colors.primary],
    ['Warning', 'Override Tailwind alias tokens for radii and fonts.', colors.warning],
    ['Danger', 'Do not fork templates just to change colors.', colors.fail],
  ]) {
    const item = frame(`Callout / ${title}`, 350, 180, colors.elevated);
    autoLayout(item, 'VERTICAL', 10, 20);
    rounded(item, 16);
    item.strokes = [{ type: 'SOLID', color: hexToPaint(color).color, opacity: 0.4 }];
    item.appendChild(textNode(title, 20, color, 'Bold'));
    item.appendChild(textNode(body, 15, colors.secondary));
    callouts.appendChild(item);
  }

  root.appendChild(card);
  root.appendChild(callouts);
  page.appendChild(root);
}

async function main() {
  await loadFonts();
  const cover = getOrCreatePage(pages.cover);
  const tokens = getOrCreatePage(pages.tokens);
  const components = getOrCreatePage(pages.components);

  populateCover(cover);
  populateTokens(tokens);
  populateComponents(components);

  figma.currentPage = cover;
  figma.viewport.scrollAndZoomIntoView(cover.children);
  figma.closePlugin('compodocx Design Token Kit populated.');
}

main().catch((error) => {
  figma.closePlugin(`Failed: ${error instanceof Error ? error.message : String(error)}`);
});
