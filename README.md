<p align="center">
  <img src="docs/assets/compodocx-mark.svg" width="120" height="120" alt="compodocx"/>
</p>

<h1 align="center">compodocx</h1>

<p align="center">
  Static documentation generator for modern Angular projects. Reads your TypeScript source, component templates, and (S)CSS, and emits a self-contained HTML site with API reference, dependency graphs, theming tokens, source viewer, and search — no server required.
</p>

<p align="center">
  <a href="https://github.com/cngxjs/compodocx/actions"><img src="https://github.com/cngxjs/compodocx/workflows/CI/badge.svg" alt="CI"/></a>
  <a href="https://www.npmjs.com/package/@cngxjs/compodocx"><img src="https://img.shields.io/npm/v/@cngxjs/compodocx.svg" alt="npm"/></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="License: MIT"/></a>
</p>

## Status

`0.1.0` — first feature-complete release with the full Phase 5 UI redesign, theming tab, JS-based custom template overrides, and compodoc-line rendering compatibility verified across the migrated CLI test suite. The CLI flags and config-file shape are backwards-compatible with compodoc, so existing projects can switch with a one-line `package.json` edit. Internal data shapes and the template-override contract may shift between 0.x minor versions, so pin the dependency until 1.0. Output HTML is static and self-contained, so generated docs keep working even if you skip a release.

## Why compodocx

compodoc is a great tool that grew up alongside AngularJS, then Angular 2, then everything since. Its rendering layer reflects that history — Bootstrap 4 markup, Handlebars partials, jQuery sprinkles, no awareness of the modern Angular surface (signals, `inject()`, host metadata, standalone components, theme tokens, `@property` rules).

compodocx is a fork of compodoc that keeps the well-tested compiler and configuration story but replaces everything from the data shapes upward:

- **Angular-only scope.** No more AngularJS / Angular 1 / TypeScript-without-Angular code paths. The compiler is free to special-case modern Angular constructs.
- **Modern rendering primitives.** JSX templates (via `@kitajs/html`), Tailwind v4 + CSS custom properties for theming, dynamic-import D3 for graphs, Pagefind for search. No jQuery, no Bootstrap, no Lunr.
- **JavaScript-based template overrides.** Replace any page or block with a CommonJS module that returns HTML. Full access to the page data and a shared helpers API. No Handlebars to learn, no DSL to fight.
- **First-class signals and `inject()`.** Components rendered with proper sections for `input()` / `output()` / `model()`, `computed()` and `linked-signal()` derived state, `effect()` blocks (opt-in), structured `host` metadata, and `inject()`-based DI alongside constructor DI.
- **Theming tab.** Document your component's theme tokens directly in the SCSS or CSS using `///` SassDoc or JSDoc-style block comments above your `--custom-prop`, `$scss-var`, or `@property` declarations. compodocx parses them out and renders a dedicated tab next to API and Source.

If you maintain a modern Angular library or app and want documentation that looks like it was built this decade, compodocx is the path with the lowest migration cost from compodoc.

## Highlights

- API pages for components, directives, services, pipes, guards, interceptors, modules, classes, interfaces, enums, type aliases, and miscellaneous functions / variables.
- Per-component dependency graph (D3) for standalone imports, project-level module graph (Graphviz), source-code DOM tree, and a Source Viewer with sticky line stack and `#L42` deep links.
- Eight bundled themes (Slate Noir default, plus Ocean, Midnight, Nord, Rosé Pine, Ember, Neon, Brutalist) and a Gitbook compat theme. All theme tokens live in CSS custom properties; supply a custom CSS file for full control.
- Inline-doc-driven Theming tab. Author tokens with `@group`, `@example`, `@deprecated`, `@since`, `@see`, and `@overview` tags directly above your CSS / SCSS declarations.
- JavaScript-based template override system with stable per-page and per-block override names. Two Vitest specs ship with every override for safe extension.
- Documentation coverage report with CI-friendly thresholds (per-file and global), additional Markdown pages folded into the sidebar, full i18n with 17 locales, and Pagefind-powered fuzzy search.
- Keyboard navigation: `j/k` to move between member cards, `[` and `]` to focus the sidebar entity list, `?` for the shortcut overlay, `Cmd+K` (or `Ctrl+K`) for the command palette.
- Accessible by default: skip-link, semantic landmarks, ARIA labels on every icon button, focus-visible rings everywhere, `prefers-reduced-motion` honored throughout, screen-reader text alternatives for graphs.

## Requirements

- Node.js 22 or newer.
- An Angular project with a `tsconfig.json`. compodocx is built against modern Angular conventions (signals, `inject()`, standalone components) and is tested on Angular 20 / 21, but it works against any 17+ codebase.

## Install

```bash
npm install --save-dev @cngxjs/compodocx
```

Inside an Angular workspace you can use the schematic, which seeds `tsconfig.doc.json`, registers the `compodocx:*` npm scripts, and (if you are coming from `@compodoc/compodoc`) migrates your existing artefacts in the same pass:

```bash
ng add @cngxjs/compodocx
```

Useful flags:

- `--skip-migration` — leave existing `@compodoc/compodoc` dependency and `compodoc:*` scripts in place.
- `--project <name>` — required in workspaces where `angular.json` declares more than one project.
- `--script-prefix compodoc` — generate the legacy `compodoc:*` script names instead of the default `compodocx:*`.

## Quick start

```bash
# Generate static documentation into ./docs
npx compodocx -p tsconfig.app.json -d docs

# Generate and serve on http://localhost:8080 (auto-opens in browser)
npx compodocx -p tsconfig.app.json -d docs -s -o

# Watch source files and rebuild the served docs on every change
npx compodocx -p tsconfig.app.json -d docs -s -w

# Export the analyzed model as JSON for downstream tooling
npx compodocx -p tsconfig.app.json -e json -d .compodoc

# Run a documentation coverage check that fails CI under 70%
npx compodocx -p tsconfig.app.json -d docs --coverageTest 70 --coverageTestThresholdFail
```

The CLI is also exposed as `compodoc` for drop-in compatibility with existing npm scripts. Both binaries ship in the same package.

## Configuration

Drop a `.compodocrc.json` (or `.compodocrc.yaml`, `.compodocrc.js`) into your project root and it gets picked up automatically. Most projects need three or four lines:

```json
{
    "tsconfig": "./tsconfig.app.json",
    "output": "./docs",
    "theme": "ocean",
    "hideGenerator": true,
    "navTabConfig": [
        { "id": "info", "label": "API" },
        { "id": "readme", "label": "Overview" },
        { "id": "source", "label": "Source" }
    ]
}
```

Every CLI flag has a config-file equivalent. The full reference for all 50+ flags lives in [`docs/configuration.md`](docs/configuration.md).

## What the generated site contains

The output of `compodocx -d docs` is a static folder you can deploy to any static host (GitHub Pages, Cloudflare Pages, Netlify, S3, your own nginx). Inside you get:

- An **Overview** dashboard with project stats, KPI tiles, the dependency graph, and an inventory of every documented entity, all linked to their detail pages.
- A **per-entity page** for each component, directive, injectable, pipe, guard, interceptor, module, class, interface, enum, and type alias. Pages have tabbed content: API, Info, Source, Templates, Tree, Examples, and (for components with documented tokens) Theming.
- A **module graph** for NgModule projects and a **dependency graph** for standalone projects, both interactive (zoom, pan, fullscreen).
- A **coverage report** with per-file scores, a JSDoc completeness breakdown, and CI-ready thresholds.
- A **routes page** with the full route tree, lazy chunks called out, and route guards linked to their guard entities.
- A **search index** powered by Pagefind. Works offline, fully fuzzy, no JS framework needed.

## Authoring docs in your code

compodocx builds on the JSDoc-tag conventions from compodoc but adds a few that matter for modern Angular:

- `@slot <name> <description>` on a component pulls into a dedicated Slots section in the Info tab.
- `@overview` in a CSS / SCSS file produces the prose intro at the top of the Theming tab.
- `@group <name>` on a token bucket organizes the Theming tab and the token index.
- `@example` blocks (multi-line, fenced) render with Shiki syntax highlighting in both API and Theming tabs.
- `@playground <title>` blocks add a dedicated Playground tab on the component page, with an "Open in StackBlitz" button per block. The body can be an inline fenced snippet, a `./path.html` file reference, or a `./path.component.ts` standalone-component reference (with `templateUrl` / `styleUrl` siblings and relative imports walked automatically). See [MIGRATION.md](MIGRATION.md#adding-runnable-playground-blocks) for the authoring guide.
- `@deprecated [reason]` adds a strikethrough plus a deprecation banner to any entity, member, or token.
- `@since <version>` adds a "since" chip next to the entity / member / token name.
- `@see <url-or-name>` renders a "See also" link list.

For the full Theming tab convention (which tokens get parsed, which doc styles work, which tags do what), see [`docs/theming-tokens-authoring-guide.md`](docs/theming-tokens-authoring-guide.md).

## Documentation

| Topic                                     | File                                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| Full configuration reference (50+ flags)  | [`docs/configuration.md`](docs/configuration.md)                                   |
| Custom JavaScript template overrides      | [`docs/custom-templates.md`](docs/custom-templates.md)                             |
| Authoring theme tokens in your SCSS / CSS | [`docs/theming-tokens-authoring-guide.md`](docs/theming-tokens-authoring-guide.md) |
| Shipping additional Markdown pages        | [`docs/additional-pages.md`](docs/additional-pages.md)                             |
| Internationalization                      | [`docs/i18n.md`](docs/i18n.md)                                                     |
| Releasing a new version (maintainer doc)  | [`docs/RELEASING.md`](docs/RELEASING.md)                                           |

## Coming from compodoc

CLI flags and config-file keys are backwards-compatible. In `package.json` scripts, replace `@compodoc/compodoc` with `@cngxjs/compodocx` and `compodoc` with `compodocx`. Most projects work after just that change.

What's actually different and may need attention:

- **Templates** — `--templates` now expects JavaScript files (CommonJS modules), not Handlebars partials. Custom `.hbs` templates need to be ported to the JS API. The data shape passed in is richer and properly typed; see [`docs/custom-templates.md`](docs/custom-templates.md).
- **Themes** — the bundled theme set is different. `material` and the old compodoc themes are not shipped. Pick one of the eight built-in themes (`default`, `ocean`, `midnight`, `nord`, `rose-pine`, `ember`, `neon`, `brutalist`) or point `--theme` at a custom CSS file. Existing custom CSS themes need a sweep — class names are now `cdx-` prefixed.
- **CSS classes** — emitted classes are `cdx-` prefixed throughout (e.g. `cdx-member-card`, `cdx-graph-viewport`). Stylesheets that target internal class names need an update.
- **Search** — Lunr is replaced with Pagefind. The `search-results` and `search-input` template overrides no longer exist. The search experience is faster and works offline; no migration step needed unless you customized the search UI.
- **Bootstrap markup** — gone entirely. If you scraped the output for downstream automation that relied on Bootstrap class names (`card`, `card-block`, `panel`, `nav-tabs`, …), the new selectors are `cdx-` prefixed equivalents.

A complete, point-by-point migration guide ships in [`MIGRATION.md`](./MIGRATION.md).

## Development

```bash
git clone https://github.com/cngxjs/compodocx.git
cd compodocx
npm ci
npm run build
npm run test:all
```

Useful scripts during development:

| Task                  | Command                       |
| --------------------- | ----------------------------- |
| Unit tests (Vitest)   | `npm run test:unit`           |
| CLI integration tests | `npm run test:cli`            |
| Playwright e2e        | `npm run test-e2e-playwright` |
| Lint (Biome)          | `npm run lint`                |
| Format (Biome)        | `npm run format:write`        |

The dev watcher rebuilds the docs site for one of the bundled fixtures whenever a source or fixture file changes:

```bash
npm run dev          # standalone fixture, port 8081
npm run dev:module   # NgModule fixture, port 8080
```

Pass watcher flags through with `--`:

```bash
npm run dev -- --fixture=todomvc-ng2 --port=4001 --search
```

Issues and pull requests are welcome at [github.com/cngxjs/compodocx](https://github.com/cngxjs/compodocx).

## Acknowledgments

compodocx is a fork of [compodoc](https://github.com/compodoc/compodoc) by Vincent Ogloblinsky and the compodoc contributors. Their work on the analyzer, the JSDoc tag handling, the route-graph layout, and the original page structure is the foundation everything here is built on. The cngx fork narrows the scope to Angular only and modernizes the rendering layer: JSX templates, signal-aware compiler, CSS custom properties, JavaScript-based overrides, Pagefind search, and a redesigned UI.

## License

MIT. See [`LICENSE`](LICENSE) for the full copyright notice.
