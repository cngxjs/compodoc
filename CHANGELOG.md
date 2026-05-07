# Changelog

All notable changes to compodocx are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the version numbers follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For the upstream compodoc history that predates the cngx fork, see <https://github.com/compodoc/compodoc/blob/master/CHANGELOG.md>.

## [0.2.0] — 2026-05-07

Build modernization. Replaces the Rollup + esbuild + tsc + Tailwind + node-script chain with a single bundler — tsdown 0.21.10 (Rolldown engine, Rust) — for both the lib bundle and the client bundle. No public API change, no CLI flag change, no template API change. The published tarball is byte-for-byte equivalent in user-visible behavior; the lib bundle now ships dual ESM + CJS output for forward compatibility.

### Changed

- **Lib bundle migrated from Rollup to tsdown** (#48). Three entry points unchanged (`index-cli`, `index`, `template-playground-server`). Output is now dual format — CJS at `dist/*.js` (preserves the `main` field, the bin shim, and `scripts/start-playground-simple.js` `require()` resolution) and ESM at `dist/*.mjs` (added). Inline source maps preserved. The full Rollup `external` list ported verbatim into `deps.neverBundle`, because tsdown's auto-detection misses sub-path imports like `neotraverse/legacy`. Rolldown's default `dynamicImportInCjs: true` (semantics negated relative to classic Rollup) preserves `await import('shiki' | 'chokidar' | ...)` in CJS output, which is required because shiki is ESM-only and cannot be `require()`'d. `@rollup/plugin-typescript`, `@rollup/plugin-json`, and `rollup` removed from devDependencies.

- **Client bundle migrated from esbuild to tsdown** (#49). Single config file `tsdown.client.config.ts`. ESM-only, minified, ES2020, `platform: 'browser'`. D3 stays lazy-loaded as a separate chunk under `src/resources/js/chunks/` (preserved from esbuild behaviour — module-graph pages only fetch D3 on demand). Pagefind unchanged: `await import(/* @vite-ignore */ pagefindUrl)` is a runtime-URL form that bundlers cannot follow, so it is fetched from the deployed site at runtime. `deps.alwaysBundle: [/.*/]` forces every `dependencies` entry to inline; without this override, tsdown's auto-externalization would leave `await import('d3')` as a bare specifier the browser cannot resolve. Bundle size regressed in the project's favour: total client gzipped 110.3 KB → 106.9 KB (-3.1%); entry chunk gzipped 14.5 KB → 13.9 KB (-4.0%). esbuild removed from devDependencies.

### Fixed

- **`@compodoc/ngd-transformer` default-import resolution under Rolldown** (#48). The package flags itself `__esModule: true` but exports no `default`, so `import ngdT from '@compodoc/ngd-transformer'` followed by `new ngdT.DotEngine(...)` resolved to `undefined.DotEngine` at runtime under Rolldown's spec-strict ESM interop (Rollup tolerated this via `@rollup/plugin-typescript` letting TypeScript apply `esModuleInterop` first). Switched `src/app/engines/ngd.engine.ts` to `import { DotEngine } from '@compodoc/ngd-transformer'`. The named import is also more idiomatic TypeScript and works under both bundlers.

- **CLI shebang stripped from `dist/index-cli.{js,mjs}`** (#48). tsdown 0.21.x has a known issue (rolldown/tsdown#886, #300) where it removes the `#!/usr/bin/env node` shebang from CJS and ESM entries. Added `scripts/postbuild-shebang.mjs` as a post-build step that re-prepends the shebang and chmods 0755 on both formats. Idempotent. Without this, direct invocation of the bin would fail on POSIX systems.

- **`scripts/dev-watch.mjs` was broken after the bundler swap** (#50). The dev watcher invoked `npx esbuild` and `npx rollup` directly from its build steps, both of which were removed in #48 / #49. Switched both invocations to `npx tsdown` (root config for the lib step, `tsdown.client.config.ts` for the client step). `npm run dev`, `dev:standalone`, and `dev:module` work again.

### Internal

- **`src/resources/js/compodocx.js` is now a gitignored build artifact** (#50). The file had been tracked since the 0.0.1 initial commit but never updated, and the chunks it referenced (`src/resources/js/chunks/*.js`) were already gitignored, so the committed version always pointed at chunk hashes that don't exist on disk after a fresh clone. Added to `.gitignore`, removed from tracking via `git rm --cached`. The vendored `libs/jszip.min.js` stays tracked. The npm tarball still ships the regenerated bundle because `src/resources/` is in `package.json` `files` and the release workflow runs `npm run build` before `npm pack`.

- **Phase 7 build modernization complete.** Three PRs (#48, #49, #50) landed across a single working week. Plan doc: `.internal/2026-05-06-phase7-build-modernization-plan.md`. Build chain is now `tsdown && postbuild-shebang && tsc(schematics) && tsdown(client) && tailwindcss && copy-themes`. Single bundler engine (Rolldown) for everything that produces JavaScript.

## [0.1.0] — 2026-05-06

The first feature-complete release. Closes the compodoc → compodocx rendering compatibility gap surfaced by a full sweep of the legacy CLI test suite, drops the last `it.skip` / `describe.skip` markers from the migration era, and brings the published behaviour up to "no broken promises" against the migration guide.

### Fixed

- **Custom property and method decorator listing on the API tab.** `BlockProperty` and `BlockMethod` now render `p.decorators` / `m.decorators` (already populated upstream by `class-helper.ts:formatDecorators`) inside a `cdx-member-decorators` line, with `<br />`-separated entries when multiple decorators stack on the same member. Custom decorators like `@LogProperty()`, `@LogPropertyWithArgs('theCurrentFilter')`, and `@throttle(1000 as PollingSpeed, {leading: true})` now reach the rendered output again instead of disappearing into the source-code panel only.
- **Component metadata table now includes `changeDetection`, `encapsulation`, and `preserveWhitespaces`.** The TSX rewrite had pushed those boolean / enum traits into hero-row badges only; downstream consumers that grep the metadata-card labels (Change detection / Encapsulation / Preserve whitespaces) for migration scripts and snapshot tests had nothing to match. Both surfaces ship now — badges for visual emphasis, metadata-card row as the source-of-truth label.
- **Private-only constructors render with their modifier badge.** `EntityPage`'s Dependencies branch falls back to `BlockConstructor` when `e.constructorObj.modifierKind` is non-empty but inject() props and constructor args are both empty, so a `private constructor()` now surfaces a proper Constructor section with `cdx-member-modifier--private">Private` chip instead of being filtered out entirely.
- **`@NgModule({ providers, … })` shorthand resolution.** `SymbolHelper.getProviderEntries` previously bailed out when the prop was an Object-Literal-Shorthand (`@NgModule({ providers })` referencing a local `const providers = [Foo]`) because the prop's initializer was an `Identifier`, not an `ArrayLiteralExpression`. Threaded `srcFile` through and added a shorthand-aware branch that walks the file's top-level `const`/`let` declarations to find the bound array literal — same pattern as `parseSymbols`. The AboutModule providers section renders again, and `<h3>Providers</h3>` reappears for every module that uses the shorthand pattern.
- **Constructor JSDoc threading into the Dependencies section.** `visitConstructorDeclaration` now copies `@param` descriptions back onto each `result.args` entry after `mergeTagsAndArgs`, and `DependenciesSection` gained two optional fields: `description` (per-dep, rendered below the dep row inside `cdx-deps-desc`) and `constructorDescription` (whole constructor body, rendered above the deps list inside `cdx-deps-constructor-desc`). Both flow through `parseDescription` so `{@link X}` resolves to a proper anchor. Restores the `Watch {@link TodoStore}` constructor body link on the Todo class and the `A TodoStore -> see {@link TodoStore}` per-param description on FooterComponent.

### Internal

- **CLI test migration complete.** Six clusters of stale Bootstrap-era assertions (12 spec files, ~250 assertions across `cli-extends`, `cli-typedoc-examples`, `cli-generation`, `cli-disable-options`, `cli-generation-big-app`, `cli-jsdoc-examples`, `cli-coverage`, `cli-unit-test`, `cli-deprecated`, `cli-duplicates`, `cli-toggle-menu-items`, `cli-uniqid`) rewritten against the cdx-\* TSX markup surface. No `it.skip` / `describe.skip` markers remaining from the migration era. The legacy `routing-without-module` fixture (12 files) targeting the deprecated Angular ≤ 8 `loadChildren: 'app/path#ModuleName'` string-syntax was removed entirely.
- **CLI assertion markup reference added to `CLAUDE.md`.** Documents every Bootstrap → cdx-\* shift surfaced during the migration so future spec authors can write assertions against the right landmarks the first time.

## [0.0.5] — 2026-05-05

### Fixed

- **Class-level `@example` (and every other class-level JSDoc tag) was silently dropped from generated component / directive pages.** The TSX-era Examples section on the Info tab (and any other render path that reads `c.jsdoctags`) saw an empty array because `component-dep.factory.ts` and `directive-dep.factory.ts` accessed `IO.jsdoctags[0].tags` — a leftover from a 2017-era compodoc shape where `IO.jsdoctags` was wrapped in a single-element array. After the migration `IO.jsdoctags` is the flat tag array directly, so `[0].tags` returned `undefined` for every component and directive. The bug was invisible in old compodoc because its Handlebars templates never read class-level `c.jsdoctags` — they only sourced examples from `component.exampleUrls` (iframe previews). The TSX migration added a real Examples section but built it on top of the pre-existing broken data path. Both factories now assign `IO.jsdoctags` directly. Verified against a project with 163 `@example` tags: 22 component pages now render an Examples section that previously rendered nothing.

## [0.0.4] — 2026-05-05

### Fixed

- **Sidebar sections opened by default regardless of `toggleMenuItems`**. The Handlebars-era helper read `toggleMenuItems` as a whitelist of types that stay open, with the special token `'all'` collapsing everything; the JSX port inverted the semantics so `['all']` (the default) caused every section to render fully expanded. The default now matches compodoc's long-standing behaviour again — sections start collapsed unless their type is explicitly listed in `toggleMenuItems`.

### Changed

- **Release pipeline gated on CI.** The `Release` workflow now waits for the main CI workflow (4-OS x 2-node-matrix + e2e) to succeed on the same commit before publishing to npm, plus runs `npm run lint` itself as defence-in-depth. Tags pushed against commits that fail CI are no longer published.

### Internal

- Dependency bumps (patch + minor only): `@angular-devkit/schematics 21.1→21.2.9`, `@biomejs/biome 2.4.10→2.4.14`, `@playwright/test 1.57→1.59.1`, `@types/node 25.0→25.6`, `cheerio 1.1.2→1.2.0`, `rollup 4.55→4.60`. Major bumps deferred (i18next, marked, os-name, ts-morph, uuid, esbuild).
- Release workflow now uses Node 24 + npm 11 so OIDC Trusted Publisher works without a pre-publish CLI upgrade step.

## [0.0.3] — 2026-05-05

### Fixed

- **Folder grouping in the sidebar for multi-project Angular workspaces** (`projects/<group>/<lib>/src/...`). The grouping function had a hardcoded marker list that stripped at the first `src/` it found, which collapsed the entire `projects/<group>/<lib>` hierarchy into nothing. Workspaces ended up with either no grouping or a flat per-library group, ignoring `groupDepth` entirely. The function now detects the `projects/` prefix, strips it, and also strips the inner `/src/` folder so segments become `[<group>, <lib>, ...rest]`. With `groupDepth: 2` you now get one sidebar group per library (e.g. `forms/field`, `ui/layout`); `groupDepth: 1` gives one group per top-level project (e.g. `forms`, `ui`, `common`). Single-app layouts are unchanged.

## [0.0.2] — 2026-05-05

### Fixed

- **Published tarball was missing two runtime files** — `src/data/api-list.json` (Angular API name index used by the type linker) and `src/banner` (ASCII startup banner). Both are required at runtime by the bundled CLI but were excluded from the `files` whitelist in 0.0.1, causing `Cannot find module '.../src/data/api-list.json'` on every invocation of an installed `0.0.1` package. The 0.0.2 tarball includes both files, restoring CLI functionality. **0.0.1 is broken on npm — install 0.0.2 or later.**

## [0.0.1] — 2026-05-05

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
