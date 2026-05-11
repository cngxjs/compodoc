# Figma Design Token Kit

Source Figma file: <https://www.figma.com/design/TywTWca4t2HvJiQtavLt3S/compodocx-Figma>

This kit is a forkable companion for teams that want to design a compodocx theme before writing CSS. It mirrors the public theme contract from `src/themes/theme-template.css` and the theme guide on `compodocx.dev`.

## Pages

| Page | Purpose |
|-|-|
| Cover | Explain what the kit is, link to docs, and show the theme preview frame. |
| Tokens | Figma variables grouped like compodocx CSS custom properties. |
| Components | Small themed examples that prove the tokens work together. |

## Cover Page

Create a desktop frame named `Cover / 1440`.

Use this content:

```text
compodocx Design Token Kit
Design a docs theme in Figma, export the same decisions as CSS custom properties, and ship it with compodocx --theme.

Works with: surfaces, text, brand accents, entity colors, badges, modifiers, code blocks, graphs, radii, spacing, typography, shadows, and transitions.

Docs: https://compodocx.dev/guides/themes/
Template CSS: src/themes/theme-template.css
```

Recommended cover layout:

| Element | Size / Notes |
|-|-|
| Frame | 1440 x 960, background `surface/bg`. |
| Hero card | 1120 x 640, centered, 32 px radius, `surface/elevated`, `shadow/lg`. |
| Title | 72 px, `font/heading`, `text/default`. |
| Subtitle | 24 px, `font/body`, `text/secondary`, max width 760. |
| Token strip | 12 color chips from the key surface/text/primary/entity tokens. |
| CTA chips | `--theme my-brand.css`, `compodocx.dev/guides/themes`, `--color-cdx-*`. |

## Variable Collections

On the existing `Tokens` page, create one collection named `compodocx` with two modes: `Light` and `Dark`.

Use slash-separated names so Figma groups them clearly. Keep CSS names in each variable description.

### Surface

| Variable | Light value | CSS token |
|-|-|-|
| `surface/bg` | `hsl(0 0% 96%)` | `--color-cdx-bg` |
| `surface/bg-alt` | `hsl(0 0% 93%)` | `--color-cdx-bg-alt` |
| `surface/elevated` | `hsl(0 0% 100%)` | `--color-cdx-bg-elevated` |
| `surface/code` | `hsl(0 0% 93%)` | `--color-cdx-bg-code` |
| `surface/code-block` | `hsl(0 0% 14%)` | `--color-cdx-bg-code-block` |

### Text

| Variable | Light value | CSS token |
|-|-|-|
| `text/default` | `hsl(0 0% 12%)` | `--color-cdx-text` |
| `text/secondary` | `hsl(0 0% 40%)` | `--color-cdx-text-secondary` |
| `text/muted` | `hsl(0 0% 48%)` | `--color-cdx-text-muted` |
| `text/inverse` | `hsl(0 0% 96%)` | `--color-cdx-text-inverse` |

### Primary

| Variable | Light value | CSS token |
|-|-|-|
| `primary/default` | `hsl(0 0% 15%)` | `--color-cdx-primary` |
| `primary/hover` | `hsl(0 0% 30%)` | `--color-cdx-primary-hover` |
| `primary/subtle` | `hsl(0 0% 84%)` | `--color-cdx-primary-subtle` |

### Entity Accents

| Variable | Light value | CSS token |
|-|-|-|
| `entity/component` | `#0e8578` | `--color-cdx-entity-component` |
| `entity/service` | `#a56a07` | `--color-cdx-entity-service` |
| `entity/directive` | `#7c3aed` | `--color-cdx-entity-directive` |
| `entity/pipe` | `#e2177b` | `--color-cdx-entity-pipe` |
| `entity/module` | `#1e6ff5` | `--color-cdx-entity-module` |
| `entity/class` | `#05875f` | `--color-cdx-entity-class` |
| `entity/interface` | `#475569` | `--color-cdx-entity-interface` |
| `entity/guard` | `#eb1515` | `--color-cdx-entity-guard` |
| `entity/interceptor` | `#ba25cd` | `--color-cdx-entity-interceptor` |
| `entity/function` | `#52840b` | `--color-cdx-entity-function` |
| `entity/variable` | `#617087` | `--color-cdx-entity-variable` |
| `entity/typealias` | `#6164f1` | `--color-cdx-entity-typealias` |
| `entity/enum` | `#c2410c` | `--color-cdx-entity-enum` |

### Badge Base Colors

Badge text, borders, and fills are derived in CSS with `color-mix()`. Model only the base color in Figma.

| Variable | Light value | CSS token |
|-|-|-|
| `badge/standalone` | `hsl(170 55% 38%)` | `--color-cdx-badge-standalone` |
| `badge/token` | `hsl(260 50% 48%)` | `--color-cdx-badge-token` |
| `badge/beta` | `hsl(35 75% 42%)` | `--color-cdx-badge-beta` |
| `badge/factory` | `hsl(200 50% 42%)` | `--color-cdx-badge-factory` |
| `badge/zoneless` | `hsl(280 45% 48%)` | `--color-cdx-badge-zoneless` |
| `badge/breaking` | `hsl(0 65% 45%)` | `--color-cdx-badge-breaking` |
| `badge/signal` | `hsl(210 60% 42%)` | `--color-cdx-badge-signal` |
| `badge/computed` | `hsl(270 50% 45%)` | `--color-cdx-badge-computed` |
| `badge/effect` | `hsl(45 70% 40%)` | `--color-cdx-badge-effect` |
| `badge/resource` | `hsl(190 55% 38%)` | `--color-cdx-badge-resource` |
| `badge/model` | `hsl(240 45% 45%)` | `--color-cdx-badge-model` |
| `badge/after-render` | `hsl(25 65% 40%)` | `--color-cdx-badge-after-render` |
| `badge/after-next-render` | `hsl(15 65% 42%)` | `--color-cdx-badge-after-next-render` |
| `badge/after-every-render` | `hsl(5 60% 42%)` | `--color-cdx-badge-after-every-render` |
| `badge/after-render-effect` | `hsl(340 55% 42%)` | `--color-cdx-badge-after-render-effect` |
| `badge/input` | `hsl(145 50% 35%)` | `--color-cdx-badge-input` |
| `badge/output` | `hsl(350 50% 42%)` | `--color-cdx-badge-output` |
| `badge/view-child` | `hsl(165 50% 35%)` | `--color-cdx-badge-view-child` |
| `badge/content-child` | `hsl(55 60% 35%)` | `--color-cdx-badge-content-child` |
| `badge/inject` | `hsl(320 45% 45%)` | `--color-cdx-badge-inject` |
| `badge/host` | `hsl(180 50% 35%)` | `--color-cdx-badge-host` |

### Modifier Base Colors

| Variable | Light value | CSS token |
|-|-|-|
| `modifier/private` | `hsl(0 50% 40%)` | `--color-cdx-mod-private` |
| `modifier/protected` | `hsl(35 60% 35%)` | `--color-cdx-mod-protected` |
| `modifier/readonly` | `hsl(210 50% 40%)` | `--color-cdx-mod-readonly` |
| `modifier/static` | `hsl(270 40% 42%)` | `--color-cdx-mod-static` |
| `modifier/async` | `hsl(170 45% 32%)` | `--color-cdx-mod-async` |

### Feedback

| Variable | Light value | CSS token |
|-|-|-|
| `status/pass` | `#16a34a` | `--color-cdx-status-pass` |
| `status/fail` | `#ef4444` | `--color-cdx-status-fail` |
| `status/warning` | `#ca8a04` | `--color-cdx-status-warning` |
| `overlay/default` | `hsl(0 0% 14% / 0.4)` | `--color-cdx-overlay` |
| `feedback/deprecated` | `hsl(38 92% 32.5%)` | `--color-cdx-deprecated` |
| `feedback/danger` | `hsl(0 72% 51%)` | `--color-cdx-danger` |

### Borders And Shadows

| Variable | Light value | CSS token |
|-|-|-|
| `border/default` | `hsl(0 0% 86%)` | `--color-cdx-border` |
| `border/strong` | `hsl(0 0% 60%)` | `--color-cdx-border-strong` |
| `border/focus` | `hsl(0 0% 15%)` | `--color-cdx-border-focus` |
| `shadow/sm` | `0 1px 3px hsl(0 0% 0% / 0.08)` | `--shadow-cdx-sm` |
| `shadow/md` | `0 4px 14px hsl(0 0% 0% / 0.1)` | `--shadow-cdx-md` |
| `shadow/lg` | `0 16px 36px hsl(0 0% 0% / 0.14)` | `--shadow-cdx-lg` |

### Typography

| Variable | Light value | CSS token |
|-|-|-|
| `font/heading` | `"Instrument Sans", system-ui, sans-serif` | `--font-heading` |
| `font/body` | `"Source Sans 3", system-ui, sans-serif` | `--font-body` |
| `font/code` | `ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace` | `--font-code` |
| `font/sans` | `"Source Sans 3", system-ui, sans-serif` | `--font-sans` |
| `font/mono` | `ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace` | `--font-mono` |

### Radii And Spacing

| Variable | Light value | CSS token |
|-|-|-|
| `radius/sm` | `4px` | `--radius-cdx-sm` |
| `radius/md` | `8px` | `--radius-cdx-md` |
| `radius/lg` | `12px` | `--radius-cdx-lg` |
| `radius/tw-sm` | `4px` | `--radius-sm` |
| `radius/tw-md` | `8px` | `--radius-md` |
| `radius/tw-lg` | `12px` | `--radius-lg` |
| `radius/tw-2xl` | `12px` | `--radius-2xl` |
| `density/default` | `1` | `--cdx-density` |
| `spacing/xs` | `4px` | `--spacing-cdx-xs` |
| `spacing/sm` | `8px` | `--spacing-cdx-sm` |
| `spacing/md` | `12px` | `--spacing-cdx-md` |
| `spacing/lg` | `16px` | `--spacing-cdx-lg` |
| `spacing/xl` | `20px` | `--spacing-cdx-xl` |
| `spacing/2xl` | `24px` | `--spacing-cdx-2xl` |
| `spacing/sidebar` | `320px` | `--spacing-cdx-sidebar` |

### Code And Graphs

| Variable | Light value | CSS token |
|-|-|-|
| `code/snippet-bg` | `hsl(0 0% 93%)` | `--color-cdx-snippet-bg` |
| `code/snippet-border` | `transparent` | `--color-cdx-snippet-border` |
| `code/snippet-radius` | `var(--radius-cdx-md)` | `--color-cdx-snippet-radius` |
| `code/inline` | `#c2185b` | `--color-cdx-code-inline` |
| `code/dark-surface` | `hsl(0 0% 14%)` | `--color-cdx-code-dark-surface` |
| `code/scrollbar` | `hsl(0 0% 50% / 0.4)` | `--color-cdx-scrollbar` |
| `code/line-number` | `hsl(0 0% 50% / 0.5)` | `--color-cdx-line-number` |
| `code/line-hover` | `hsl(0 0% 0% / 0.06)` | `--color-cdx-line-hover` |
| `code/line-highlight` | `hsl(48 96% 53% / 0.25)` | `--color-cdx-line-highlight` |
| `code/line-highlight-flash` | `hsl(48 96% 53% / 0.3)` | `--color-cdx-line-highlight-flash` |
| `code/copy-success` | `hsl(142 50% 40%)` | `--color-cdx-copy-success` |
| `code/lang-chip` | `hsl(0 0% 60%)` | `--color-cdx-lang-chip` |
| `code/lang-chip-bg` | `hsl(0 0% 50% / 0.1)` | `--color-cdx-lang-chip-bg` |
| `graph/bg` | `var(--color-cdx-bg-alt)` | `--color-cdx-graph-bg` |
| `graph/border` | `transparent` | `--color-cdx-graph-border` |
| `graph/border-width` | `0` | `--color-cdx-graph-border-width` |
| `graph/radius` | `var(--radius-cdx-md)` | `--color-cdx-graph-radius` |
| `transition/fast` | `120ms ease` | `--cdx-transition-fast` |
| `transition/base` | `200ms ease` | `--cdx-transition-base` |

## Components Page

On the existing `Components` page, create these components as examples, not as a complete UI library.

| Component | Variants | Tokens to prove |
|-|-|-|
| `Button` | Primary, Secondary, Ghost | `primary/*`, `surface/*`, `border/*`, `radius/md`, `transition/base`. |
| `Card` | Default, Elevated, Code | `surface/elevated`, `surface/code`, `shadow/*`, `text/*`. |
| `Callout` | Info, Warning, Danger | `primary/subtle`, `status/warning`, `feedback/danger`. |
| `Badge` | Signal, Input, Output, Inject, Host | `badge/*` base colors. |
| `Entity Row` | Component, Service, Directive, Pipe | `entity/*`, `text/*`, `surface/bg-alt`. |
| `Code Snippet` | Default, Highlighted | `code/*`, `font/code`, `radius/md`. |

## CSS Export Shape

When a theme is ready, export decisions to this shape:

```css
/* @theme My Brand */
:root {
  --color-cdx-bg: hsl(220 16% 98%);
  --color-cdx-bg-elevated: hsl(0 0% 100%);
  --color-cdx-text: hsl(220 20% 14%);
  --color-cdx-primary: hsl(222 68% 52%);
  --radius-cdx-md: 8px;
}

.dark {
  --color-cdx-bg: hsl(225 16% 10%);
  --color-cdx-bg-elevated: hsl(225 16% 14%);
  --color-cdx-text: hsl(220 16% 90%);
  --color-cdx-primary: hsl(222 85% 65%);
}
```

Run it with:

```bash
compodocx --theme ./my-brand.css
```

## Maintenance

When theme tokens change in compodocx, update this file and the Figma variables together. The source of truth remains `src/themes/theme-template.css`.
