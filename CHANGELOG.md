# Changelog

All notable changes to compodocx are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For the upstream compodoc history that predates the cngx fork, see <https://github.com/compodoc/compodoc/blob/master/CHANGELOG.md>.

## [0.0.1] — Unreleased

First cngx-line tag. compodocx forks compodoc 1.1.32 with the analyzer and configuration story preserved and the rendering layer rewritten from scratch.

### Identity

- Renamed package to `@cngxjs/compodocx` and CLI to `compodocx` (with `compodoc` kept as a binary alias for drop-in compatibility).
- Repository moved to <https://github.com/cngxjs/compodocx>.
- Scope narrowed to Angular only — AngularJS, Angular 1, and TypeScript-without-Angular code paths removed from the analyzer.
- New brand mark, README, and MIGRATION.md.

### Rendering layer (rewritten)

- Migrated all page and block templates from Handlebars to JSX via `@kitajs/html`. The two systems are not compatible at the template level — see `MIGRATION.md` for the cookbook.
- Replaced Bootstrap 4 markup throughout with semantic HTML and CSS Grid / Flexbox layouts. All emitted classes are now `cdx-` prefixed; `data-compodoc="<block-name>"` attributes are also emitted on every section as a stable selector for downstream tooling and CSS.
- Replaced jQuery with native APIs in the client bundle (`src/client/`).
- Replaced Lunr search with [Pagefind](https://pagefind.app/). Search index is generated at build time and works fully offline.
- Replaced the Bootstrap-style theme switcher with a CSS-custom-property-based theme system. Eight bundled themes (`default`, `ocean`, `midnight`, `nord`, `rose-pine`, `ember`, `neon`, `brutalist`) plus a `gitbook` compat theme. Custom themes ship as a single CSS file overriding the design tokens.
- Replaced `prism.js` with [Shiki](https://shiki.matsu.io/) for syntax highlighting. Themes can pair with a Shiki theme via `--shikiTheme`.
- New design system in `src/styles/components/*.css` built on Tailwind v4 utilities + token primitives.

### Modern Angular awareness

- First-class rendering of `inject()`-based DI alongside constructor DI, with a dedicated Dependencies section and modifier badges (`optional`, `skipSelf`, `self`, `host`).
- Recognises and renders `input()`, `output()`, `model()`, `signal()`, `computed()`, `linked-signal()`, and `effect()` constructs distinctly from legacy `@Input()` / `@Output()`.
- Dedicated Derived State section showing `computed()` and `linked-signal()` properties with their `Derives from …` dependency narrative.
- Optional Effects section (`--showEffects`) for documented `effect()` blocks.
- Structured `host` metadata rendered as a flat list of typed entries (static class, static attributes, bound classes, bound styles, events, listeners) instead of a stringified object.
- Standalone-aware: per-component dependency graph for standalone imports, project-level module graph for NgModule projects, automatic detection so the right one shows up.
- New `--publicApiOnly` flag restricts processing to symbols re-exported from a project's public entry.

### Theming tab (new feature)

- New per-component Theming tab driven by inline-doc tokens parsed out of each component's SCSS or CSS.
- Supports CSS custom properties (`--cdx-foo`), SCSS variables (`$cdx-foo`), and `@property --cdx-foo` rules.
- JSDoc / SassDoc tag set: `@overview`, `@type`, `@default`, `@group`, `@example`, `@since`, `@deprecated`, `@see`. `@property` rules' `syntax` and `initial-value` populate `type` and `defaultValue` automatically.
- Configurable via `themingTabSections: ['overview', 'index', 'tokens', 'source']` in the config file.
- Source authoring guide at `docs/theming-tokens-authoring-guide.md`.

### Custom template overrides (new contract)

- `--templates` now expects JavaScript files (CommonJS modules) under `partials/`, replacing the Handlebars partials used by compodoc.
- Each override receives `(data, helpers)` and returns a raw HTML string.
- 27 page-level override names plus 16 block-level override names exposed as a stable contract — see `MIGRATION.md`.
- `helpers` exposes the full export of `src/templates/helpers/index.ts` (i18n `t()`, `linkTypeHtml()`, `parseDescription()`, `codeWrap()`, `functionSignature()`, …) — see `MIGRATION.md` for the full table.
- Reference templates live at `test/fixtures/test-templates/partials/` and are exercised by the CLI integration tests.

### CLI changes

- New flags: `--showEffects`, `--publicApiOnly`, `--disableDependenciesTab`, `--gaID`.
- Removed: `--gaSite` (Universal Analytics is end-of-life — use `--gaID` with a GA4 measurement ID).
- All other compodoc flags retained with identical behavior.
- Help text rewritten where stale (`--templates` no longer says "Handlebars").

### UI redesign (Phase 5)

Full visual overhaul:

- New entity hero with breadcrumb, title, badges, file path.
- Member cards reorganised as flat `cdx-io-member` rows for API blocks (`BlockMethod`, `BlockProperty`, `BlockInput`, `BlockOutput`, `BlockAccessors`, `BlockIndexSignatures`, `BlockDerivedState`).
- Sticky source viewer with cloned-line stack and `#L42` deep linking.
- Stripe-style sliding-indicator tab bar on entity pages.
- Dependency graphs (D3 + Graphviz) with zoom-pan controls and fullscreen.
- Overview dashboard with project KPI tiles, dependency graph, and entity inventory chips.
- Coverage report with per-file scores, JSDoc completeness breakdown, and CI thresholds.
- Command palette (`Cmd+K` / `Ctrl+K`).
- Keyboard navigation (`j` / `k`, `[` / `]`, `?`).
- Dark mode by system preference plus manual toggle, with localStorage persistence.
- Eight-theme picker in the topbar.

### Compiler / metadata extraction

- `signalDeps[]` extracted on `computed` / `linked-signal` properties via AST walk.
- `slots[]` extracted from `@slot` JSDoc tags on components.
- `themeTokens[]`, `themeStyleSources[]`, `themeOverview` extracted on components from co-located SCSS / CSS files (one level of `@import` / `@use` followed for SCSS).
- `hostStructured` replaces the stringified `host` object.
- `ProviderEntry[]` replaces stringified `providers` / `viewProviders`.
- `inject()`-kind properties tracked separately from regular properties for the new Dependencies section.

### Documentation

- New: `MIGRATION.md` (this release).
- New: `README.md` (rewritten with a Why section, Highlights, "What the generated site contains", and "Authoring docs in your code").
- New: `docs/theming-tokens-authoring-guide.md`.
- New: `docs/custom-templates.md`.
- Updated: `docs/configuration.md` (50+ flag reference).
- New brand mark at `docs/assets/compodocx-mark.svg`.

### Build, test, infra

- `noEmit: true` in `tsconfig.json` — no stale `.js` artifacts checked in next to `.ts`.
- Replaced ESLint + Prettier with [Biome](https://biomejs.dev/).
- Replaced Mocha + Chai + Sinon with [Vitest](https://vitest.dev/).
- Added [Playwright](https://playwright.dev/) e2e suite covering the entity hero, content sections, theming tab, source viewer, hash router, sidebar focus, command palette, coverage report, and overview dashboard at three fixture projects.
- Dev watcher (`npm run dev`) rebuilds the docs site for one of the bundled fixtures whenever a source or fixture file changes.
- LICENSE refreshed: dual copyright crediting the compodoc contributors (2016–2025) and the cngx contributors (2026).

### Known limitations

- The Template Playground (`--templatePlayground`) still ships but is on the deprecation path. It generates Handlebars output that is no longer compatible with `compodocx --templates`. The ZIP export's README warns about this explicitly.
- `BlockRelationshipGraph` is intentionally not wired for `--templates` overrides (no downstream demand). Will be added if requested.
