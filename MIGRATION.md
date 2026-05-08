# Migrating from compodoc to compodocx

This guide walks through everything that changed between the upstream `@compodoc/compodoc` and `@cngxjs/compodocx`. The CLI flags and config-file shape are intentionally backwards-compatible, so a typical project switches with a one-line `package.json` edit. The rest of this document covers what is honestly different and what to do about it.

## Quick switch

In your `package.json`:

```diff
- "@compodoc/compodoc": "^1.1.32"
+ "@cngxjs/compodocx": "^0.0.1"
```

```diff
- "docs": "compodoc -p tsconfig.app.json -d docs"
+ "docs": "compodocx -p tsconfig.app.json -d docs"
```

For most projects this is the entire migration. The `compodoc` binary is also exposed by the new package, so leaving the script as `compodoc -p ...` works too.

The rest of the document only matters if you fall into one of these buckets:

- You shipped a custom Handlebars template directory via `--templates`.
- You used a built-in compodoc theme other than the new bundled set.
- Your CSS or downstream tooling targets compodoc's emitted class names.
- You scraped or post-processed the generated HTML.

## CLI flag compatibility

| Flag | Status | Notes |
|-|-|-|
| `-p`, `--tsconfig` | unchanged | Same path semantics. |
| `-d`, `--output` | unchanged | |
| `-s`, `--serve` | unchanged | |
| `-r`, `--port` | unchanged | |
| `-w`, `--watch` | unchanged | |
| `-o`, `--open` | unchanged | |
| `-e`, `--exportFormat` | unchanged | `json` and `html` are still the supported formats. The JSON shape gained typed `Export*` interfaces and three new header fields (`schemaVersion`, `generatedAt`, `compodocxVersion`) — see "JSON export" below. |
| `--jsonIndent` | **new** (default `0`) | Indent size (0–8) for `documentation.json` produced by `--exportFormat json`. Default dropped from compodoc's hardcoded `4` to `0` (single-line output, smaller files). Pass `--jsonIndent 2` to restore human-readable formatting. Out-of-range values fail fast with a clear error. |
| `-n`, `--name` | unchanged | |
| `-a`, `--assetsFolder` | unchanged | |
| `-y`, `--extTheme` | unchanged | Still accepts a path to a custom CSS file. |
| `--theme` | **new theme set** | Built-in theme names changed — see "Themes" below. |
| `--templates` | **breaking** | Now expects JavaScript files (CommonJS modules), not Handlebars partials — see "Custom templates" below. |
| `--includes`, `--includesName` | unchanged | Additional Markdown pages folded into the sidebar. |
| `--coverageTest`, `--coverageMinimumPerFile`, `--coverageTestThresholdFail` | unchanged | |
| `--disableSourceCode`, `--disableDomTree`, `--disableTemplateTab`, `--disableGraph`, `--disableCoverage`, `--disablePrivate`, `--disableProtected`, `--disableInternal`, `--disableLifeCycleHooks`, `--disableConstructors`, `--disableFilePath` | unchanged | |
| `--disableDependenciesTab` | **new** | Hides the per-component standalone-import graph independently from `--disableGraph`. |
| `--customFavicon`, `--customLogo` | unchanged | |
| `--hideGenerator`, `--hideDarkModeToggle` | unchanged | |
| `--toggleMenuItems`, `--navTabConfig` | unchanged | |
| `--gaID` | replaces `--gaSite` | Universal Analytics is gone — only GA4 measurement IDs (`G-XXXXXXXXXX`) are supported. SPA pageviews are tracked automatically. |
| `--gaSite` | **removed** | Universal Analytics tracker name no longer accepted. |
| `--showEffects` | **new** (opt-in, default `false`) | Renders Angular `effect()` blocks in a dedicated Effects section on the API tab. |
| `--publicApiOnly` | **new** | Restricts processing to symbols re-exported from a project's public entry. |
| `--minimal` | unchanged | |
| `--silent`, `--language`, `--maxSearchResults` | unchanged | |
| `--templatePlayground` | deprecated | The browser-based template playground still ships but generates Handlebars output that is no longer compatible with `--templates`. Use it for visual reference only — the ZIP export's README spells this out. The flag will be removed in a future release. |

Config-file (`.compodocrc.json`, `.compodocrc.yaml`, `.compodocrc.js`) keys mirror the CLI flags one-to-one. Existing config files keep working unchanged.

## JSON export (`--exportFormat json`)

`compodocx --exportFormat json -d <out>` writes `documentation.json`, the structured snapshot consumers like API Diff (`compodocx diff`) and the LLM context export (`--exportFormat llm-md`) read.

### New

- **Typed shape.** `ExportData` and every per-entity field (`ExportComponent`, `ExportModule`, `ExportInjectable`, `ExportPipe`, `ExportClass`, `ExportInterface`, `ExportGuard`, `ExportInterceptor`, `ExportDirective`, `ExportRoute`, `ExportCoverage`, `ExportMiscellaneous`) are exported from `@cngxjs/compodocx`. Downstream tooling can import and narrow without `any`.
- **`schemaVersion: 1`.** Single source of truth: `EXPORT_SCHEMA_VERSION` in `src/app/interfaces/export-data.interface.ts`. Bumped on every breaking shape change with a corresponding note in this file. Pre-v0.3.0 outputs had no field — consumers should treat a missing `schemaVersion` as version 0.
- **`generatedAt`** — ISO 8601 timestamp of when the snapshot was written. Useful for time-travel diffs and stale-cache detection. Non-deterministic by design; snapshot tests must either fix the clock or strip the field before comparing.
- **`compodocxVersion`** — `package.json` version of the producing CLI, for consumer telemetry and cross-version diff handling.

### Changed

- **Default JSON indent dropped from `4` → `0`.** The new `documentation.json` is single-line by default — substantially smaller. Pass `--jsonIndent 2` (or any value 0–8) to restore human-readable formatting. Tools that read the file with `jq` are unaffected; tools that depend on whitespace-sensitive regexes should opt into `--jsonIndent 2` or migrate to a JSON parser.

## Themes

The bundled theme set is different. Pick one of the new names, or supply your own CSS file via `--extTheme` / `theme: "./path/to/theme.css"`.

| Old compodoc theme | Closest replacement |
|-|-|
| `gitbook` | `gitbook` (compat theme — preserved) |
| `material` | `default` (Slate Noir, neutral) or `ocean` |
| `original` | `default` |
| `postmark` | `nord` |
| `readthedocs` | `default` |
| `stripe` | `ocean` |
| `vagrant` | `midnight` |
| `laravel` | `ember` |

The eight bundled compodocx themes:

- `default` — Slate Noir, pure neutral greyscale (light + dark)
- `ocean` — blue-cyan, paired with the `github-light:github-dark` Shiki theme
- `midnight` — purple sky-gradient, paired with `tokyo-night`
- `nord` — Nord Polar/Frost palette
- `rose-pine` — Rosé Pine Dawn / Moon
- `ember` — warm amber-orange, paired with `vitesse`
- `neon` — synthwave (single-theme dark, paired with `synthwave-84`)
- `brutalist` — sharp, high-contrast, hard shadows

Plus `gitbook` as a compat theme.

Each theme is a single CSS file overriding the design tokens defined in `src/styles/compodocx.css`. To author your own, copy `src/themes/theme-template.css`, set the tokens, and pass the path via `--theme`.

## Custom templates: HBS → JS

This is the biggest behavioral break. compodocx ships a JavaScript-based template override system that replaces compodoc's Handlebars partials. The old `<templatePath>/page.hbs`, `<templatePath>/partials/*.hbs` layout no longer applies.

### New layout

```text
my-templates/
└── partials/
    ├── overview.js
    ├── component.js
    ├── module.js
    ├── block-method.js
    └── menu.js
```

Pass that directory via `--templates ./my-templates` (or `templates: "./my-templates"` in the config file). compodocx loads every `.js` file under `partials/` into a `name → fn` map at boot.

### The contract

Every override file exports a single function:

```js
module.exports = function (data, helpers) {
    // data    — the full props the built-in template would receive
    // helpers — everything exported from src/templates/helpers/index.ts
    return '<html string here>';
};
```

The returned string is inserted raw — no escaping. If your function returns `null` or `undefined`, compodocx falls back to the built-in TSX rendering for that name.

The override is consulted **before** the built-in renderer. If a registered override exists for a given name, the built-in path is skipped entirely.

### HBS → JS cookbook

Six common Handlebars constructs and their JavaScript equivalents:

```handlebars
{{!-- 1. Expression --}}
{{name}}
```

```js
// JS equivalent
`${data.name}`
```

```handlebars
{{!-- 2. Conditional --}}
{{#if deprecated}}<span class="deprecated">{{deprecationMessage}}</span>{{/if}}
```

```js
// JS equivalent
data.deprecated ? `<span class="deprecated">${data.deprecationMessage}</span>` : ''
```

```handlebars
{{!-- 3. Iteration --}}
{{#each methods}}
    <li>{{name}}</li>
{{/each}}
```

```js
// JS equivalent
data.methods.map(m => `<li>${m.name}</li>`).join('')
```

```handlebars
{{!-- 4. Helper invocation --}}
{{linkType returnType}}
```

```js
// JS equivalent
helpers.linkTypeHtml(data.returnType)
```

```handlebars
{{!-- 5. Partial / sub-template --}}
{{> block-method methods=instanceMethods}}
```

```js
// JS equivalent — call out to your own JS module:
const blockMethod = require('./block-method.js');
return blockMethod({ methods: data.instanceMethods, file: data.file }, helpers);
```

```handlebars
{{!-- 6. Triple-stash (unescaped) --}}
{{{rawHtml}}}
```

```js
// JS equivalent — the JS API never escapes, so this is implicit:
data.rawHtml
```

### Reference templates

Two copy-paste-ready overrides live at `test/fixtures/test-templates/partials/`:

- `component.js` overrides the `component` page-level template and exercises `data.component.*`, `helpers.parseDescription()`, `helpers.functionSignature()`, `helpers.extractJsdocParams()`, and `helpers.linkTypeHtml()`. It is the override used by the `cli-templates` CLI integration spec, so it stays a working example over time.
- `block-method.js` overrides the `block-method` block-level template and exercises iteration, conditional rendering, `helpers.t()`, `helpers.linkTypeHtml()`, `helpers.parseDescription()`, and section composition.

Use either as a starting point for your own template directory.

## Override names

Every name compodocx exposes for `--templates` overrides. The names are the stable contract; the data shape passed to each is documented in the corresponding TSX source file under `src/templates/`.

### Page-level (27)

`overview`, `markdown`, `modules`, `module`, `component`, `component-detail`, `controller`, `entity`, `directive`, `injectable`, `interceptor`, `guard`, `pipe`, `class`, `interface`, `routes`, `miscellaneous-functions`, `miscellaneous-variables`, `miscellaneous-typealiases`, `miscellaneous-enumerations`, `additional-page`, `package-dependencies`, `package-properties`, `coverage-report`, `unit-test-report`, `menu`, `app-config`

### Block-level (16)

`block-theming`, `block-theming-token`, `block-method`, `block-property`, `block-input`, `block-output`, `block-accessors`, `block-host-listener`, `block-host-listeners`, `block-host-bindings`, `block-derived-state`, `block-constructor`, `block-enum`, `block-typealias`, `block-index`, `block-index-signatures`

### Intentionally not overridable for 0.0.1

- `block-relationships` — no downstream demand. Easy to add back if requested.
- `index`, `index-misc` — compodoc's old "API Index" partials. The equivalent functionality is now inline in the relevant block components.
- `link-type` — was a compodoc Handlebars helper, not a partial. The equivalent is `helpers.linkTypeHtml(typeName)` available inside any JS override.

### Removed (NOT re-added)

- `search-results`, `search-input` — Pagefind replaces Lunr and ships its own UI shell. There is nothing to override here anymore.
- `breadcrumbs` — replaced by inline rendering in the entity hero. Override the page-level template (e.g. `component`) if you need to change breadcrumb markup.

## Helper API

Every override receives a `helpers` object as its second argument. It is the full export of `src/templates/helpers/index.ts`. The list below stays in sync with that file — if it grows out of date, the source is authoritative.

| Helper | Signature | What it does |
|-|-|-|
| `t(key, opts?)` | `(string, object?) => string` | i18n lookup. Same key set as compodoc plus a few new keys (`see`, `theming`, `host`, `effects`, `derived-state`, …). |
| `capitalize(str)` | `(string) => string` | First-letter uppercase. |
| `linkTypeHtml(type)` | `(string) => string` | Renders a TypeScript type as a clickable HTML chip linking to the relevant docs page when known. |
| `resolveType(name)` | `(string) => { href, target } \| null` | Lower-level: looks up an entity name and returns the link target without rendering. |
| `parseDescription(desc, depth?)` | `(string, number?) => string` | Renders a JSDoc description through the Markdown engine, resolving `{@link}` tags relative to the entity's depth. |
| `parseProperty(propName, model)` | helper for prop-table rendering | Compodoc-compat. |
| `functionSignature(method)` | `(any) => string` | Returns a code-formatted parameter list for a method. |
| `indexableSignature(idx)` | `(any) => string` | Returns a code-formatted index-signature snippet. |
| `signalKindLabel(kind)` | `(string) => string` | Maps `'computed' \| 'linked-signal' \| 'effect' \| ...` to a human label. |
| `modifKind(k)` / `modifSlug(k)` | `(number) => string` | Map a TypeScript SyntaxKind modifier number to its label / CSS slug. |
| `modifIcon(k)` / `modifIconFromArray(arr)` | `(number) => string` | Same but returns the modifier icon SVG. |
| `oneParameterHas(args, key)` | `(any[], string) => boolean` | Checks whether any parameter has a given JSDoc tag set. |
| `relativeUrl(path)` | `(string) => string` | Compodoc-compat URL resolver. |
| `shortPath(path)` / `shortUrl(url)` | `(string) => string` | Truncates long paths / URLs for sidebar display. |
| `codeWrap(html)` | `(unknown) => string` | Wraps content in `<code>` (single-line) or `<pre>` (multi-line). |
| `highlightedCodeWrap(value)` | `(unknown) => string` | Same as `codeWrap` but routes through Shiki for syntax highlighting. |
| `extractJsdocParams(tags)` / `hasJsdocParams(tags)` | jsdoc helpers | |
| `extractJsdocExamples(tags)` / `extractJsdocCodeExamples(tags)` | jsdoc helpers | |
| `jsdocReturnsComment(tags)` | `(any[]) => string` | Pulls the `@returns` comment text. |
| `isApiSection(id)` / `isInfoSection(id)` / `isThemingSection(id)` | `(string) => boolean` | Honor the user's `--apiTabSections` / `--infoTabSections` / `themingTabSections` config when deciding what to render. |
| `isTabEnabled(navTabs, id)` | `(any[], string) => boolean` | Same idea for top-level tabs. |
| `isInitialTab(navTabs, id)` | `(any[], string) => boolean` | True if a tab is the default initial tab. |
| `hasAnyApiSections(...)` | helper for the API tab gate | |
| `isInternalMember(modifierKind?)` | `(number[]?) => boolean` | True if a member has `private` or `protected` modifiers. |
| `isReadmeEmpty(readme?)` | `(string?) => boolean` | True if the readme is whitespace or only headings. |
| `extractReadmeHeadings(readme?)` | `(string?) => string` | Returns the heading HTML from a readme, used in the empty state. |
| `computeCoverageStats(model)` | `(any) => CoverageStats` | Runs the documentation-coverage analysis on a model. |

Every helper is also reachable from outside the override system as a normal ES import — see `src/templates/helpers/index.ts` for canonical names.

## CSS class rename cheatsheet

compodoc emitted a mix of Bootstrap classes (`card`, `card-block`, `panel`, `nav-tabs`) and ad-hoc compodoc-prefixed names. compodocx prefixes everything with `cdx-` and drops the Bootstrap markup entirely.

If your custom CSS targets generated class names, this is the rough shape of the rename. Not exhaustive — search-and-replace your stylesheet against the generated HTML to be sure.

| compodoc class | compodocx replacement |
|-|-|
| `.card`, `.card-block`, `.panel` | `.cdx-member-card`, `.cdx-member-body`, `.cdx-content-section` |
| `.nav.nav-tabs`, `.nav-link`, `.tab-content`, `.tab-pane` | `.cdx-tab-bar`, `.cdx-tab`, `.cdx-tab-panel` |
| `.menu`, `.chapter`, `.link`, `.collapse` | `.cdx-sidebar`, `.cdx-sidebar-chapter`, `.cdx-sidebar-link` (legacy `.menu` and `.collapse` are still emitted for the menu's accordion JS — see CLAUDE.md note) |
| `.compodoc-icon-*` | `.cdx-icon` (Lucide-style inline SVGs in `Icons.tsx`) |
| Bootstrap badges (`.badge`, `.badge-primary`) | `.cdx-badge`, `.cdx-badge--<kind>` (one badge kind per CSS token, see `src/styles/components/badges.css`) |
| `.alert` | `.cdx-callout`, `.cdx-callout--<variant>` |
| `.coverage-*` | `.cdx-coverage-*` |
| `.col-md-*`, `.row` (Bootstrap grid) | gone — replaced by CSS Grid + Flexbox in `src/styles/components/layout.css` |
| `.modal` | `.cdx-cp-panel` (used for the command palette) |

The full set of `cdx-*` class names emitted by the renderer is documented inline in `src/templates/blocks/*.tsx` and `src/templates/pages/*.tsx`. `data-compodoc="<block-name>"` attributes are also emitted on every section to make CSS targeting and downstream scraping stable across versions.

## Template Playground

The compodoc-era browser-based Template Playground (`--templatePlayground`) still ships but is on the deprecation path. It generates Handlebars templates which are no longer compatible with `compodocx --templates`. The ZIP export's README warns about this explicitly.

For 0.0.1, treat the playground as a visual-reference tool only. A JavaScript-based replacement is on the roadmap for a later release.

## Unsupported migrations

Be honest about what does not migrate cleanly:

- **Custom Handlebars helpers.** compodoc's `loadHelpers` extension point is gone. If you wrote your own `{{myHelper foo bar}}` partials, port them as plain JavaScript functions and call them inline from your `partials/*.js` overrides.
- **`search-results` / `search-input` overrides.** Pagefind owns the search UI shell now. There is no override hook because the markup is rendered client-side from the index. Style adjustments are still possible via CSS — Pagefind's classes are documented at <https://pagefind.app/>.
- **Block-level data-shape changes.** Several block templates received structured data in compodocx where compodoc passed strings:
    - `providers` and `viewProviders` are now `ProviderEntry[]` (objects with `name`, `useExisting`, `useFactory`, `multi`, `deps`, `strategy`) instead of stringified arrays.
    - `host` is now `hostStructured`, an array of `{ kind, name, value }` records instead of a flat object.
    - `signalDeps` is a new `string[]` on `computed`/`linked-signal` properties.
    Templates that interpolated the raw strings need to walk the structured shape instead. The corresponding TSX block files (`HostSection.tsx`, `ProvidersSection.tsx`, `BlockDerivedState.tsx`) are the canonical reference.
- **`--gaSite` flag.** Universal Analytics is end-of-life. Use `--gaID G-XXXXXXXXXX` (GA4 measurement ID). SPA pageview tracking is wired automatically — no per-page beacon needed.
- **Bootstrap markup contract.** Downstream tooling that scraped specific Bootstrap selectors from compodoc's output (e.g. `.card.text-center`, `.panel-default`, `.navbar`) needs an update — those classes are no longer emitted. Use the `cdx-*` selectors or the stable `data-compodoc="<block-name>"` attributes instead.
- **Lunr search index.** Replaced by Pagefind. The `js/search/` and `pageinfo.json` files compodoc emitted are gone. Pagefind writes its index to `pagefind/` next to the HTML output.

## `compodocx migrate` CLI

Available since 0.3.0. Automates the mechanical 80% of the migration: HBS → JS template conversion, CSS class renames, and a project-level audit that points at the next step for every finding.

```text
compodocx migrate inspect <project-path>                    # audit, no writes
compodocx migrate template <file.hbs> [--out <file.js>]     # single file
compodocx migrate templates <hbs-dir> --out <js-dir>        # directory
compodocx migrate css <file-or-dir> [--aggressive]          # CSS class renames
```

Common flags across every subcommand:

- `--dry-run` — preview output, do not write to disk
- `--json` — machine-readable report (default: human console summary)
- `--no-warnings` — suppress fidelity warnings in console output (still in JSON)

### Recommended workflow

```bash
# 1. Audit the project — see what's migrate-able vs blocked.
compodocx migrate inspect ./my-compodoc-project

# 2. Convert overrideable templates.
compodocx migrate templates ./my-compodoc-project/templates --out ./templates-js

# 3. Rewrite stylesheets (conservative).
compodocx migrate css ./src/styles

# 4. Run compodocx with the new templates dir.
compodocx -p tsconfig.json -d docs --templates ./templates-js
```

### Fidelity scoring

Every conversion gets a per-file score that maps to a CLI exit code:

| Score | Meaning | Exit code |
|-|-|-|
| green | Every node mapped, no warnings. Output is mechanical, ready to use. | 0 |
| yellow | Mapped, but at least one lossy transformation. Manual review recommended. | 1 |
| red | At least one unknown helper, unsupported block, or partial with no target. Output emitted with TODO comments; user MUST review before using. | 2 |

CI pipelines can fail-fast on red migrations.

### Hard limits — what does NOT migrate

The CLI rejects two cases instead of emitting broken output:

1. **`page.hbs` (full-page layout).** compodocx's outer `Layout.tsx` is not in `CONTEXT_TEMPLATE_MAP` and is not overridable. The converter detects `page.hbs` filenames and any input starting with `<!doctype html>` and exits with code 2. Workarounds:
   - Custom CSS via `--extTheme path/to/theme.css`
   - Analytics via `--gaID G-XXXXXXXXXX` (GA4 only — Universal Analytics is gone)
   - Extra Markdown pages via `--includes path/to/pages-dir --includesName "User Guide"`

2. **Override names not in the wiring map.** Anything not matching `CONTEXT_TEMPLATE_MAP`, the `menu` special case, or a wired `block-*` name (see § Override names above). The converter exits with code 2 and points at the canonical name list. Custom user partials must be inlined into the surrounding override by hand.

### Custom Handlebars helpers

compodoc's `loadHelpers` extension point is gone. The migrate CLI cannot rewrite calls to user-authored `{{myHelper foo}}` invocations — they emit a `// TODO(migrate): unknown helper "myHelper"` and the file's score drops to red. Port the helper as a plain JavaScript function and call it inline from your `partials/*.js` override.

### CSS rewrites

Conservative mode (default) rewrites class names in `.css` / `.scss` / `.sass` only. Aggressive mode (`--aggressive`) also rewrites `.html` / `.ts` / `.tsx` / `.js` — risky against string-literal class names, so the recommended workflow is `--dry-run --aggressive` first.

`data-compodoc="<block-name>"` attributes are intentionally preserved in both modes. They are the stable downstream-scraping selector.

### ESM-package corner case

If your project's `package.json` has `"type": "module"`, the `.js` overrides emitted by the converter will fail to load — the loader at `src/app/engines/custom-template.engine.ts:52` calls `require()`. Workarounds:

- Rename converted outputs to `.cjs` after the conversion, OR
- Remove the `"type": "module"` declaration in the templates directory (if your overrides live in a sub-folder), OR
- Keep the templates directory outside the ESM package boundary entirely.

`compodocx migrate inspect` flags this case automatically.

### Issues

If the converter mishandles a real-world `.hbs` partial, please open an issue with the input file at <https://github.com/cngxjs/compodocx/issues>. Manual cookbook fallbacks are the cookbook section above.

## `compodocx diff` CLI

Available since 0.3.0. Compares two `documentation.json` snapshots produced by `compodocx --exportFormat json` and reports added / removed / changed symbols, classified by severity (`breaking` / `additive` / `docs-only`). Built for CI bots, release-notes generators, and changelog automation.

```bash
compodocx diff --old v1.json --new v2.json                 # human console
compodocx diff --old v1.json --new v2.json --json          # machine-readable
compodocx diff --old v1.json --new v2.json --md            # markdown for changelogs
compodocx diff --old v1.json --new v2.json --no-warnings   # breaking-only console
```

### Severity rules

| Change | Severity |
|-|-|
| Component / module / pipe / class removed | breaking |
| Component selector changed | breaking |
| Required input added (no default value) | breaking |
| Optional input added (with default value) | additive |
| Input removed or its type changed | breaking |
| Public method / property removed | breaking |
| Public method / property added | additive |
| Theme token removed or its type changed | breaking |
| Theme token added | additive |
| New entity added | additive |
| `@deprecated` toggled | additive |
| Description / JSDoc text changed | docs-only |
| `signalDeps` shifted (internal derivation) | docs-only |

The classifier folds the rule table over each entity's field-level shifts and picks the worst severity (breaking > additive > docs-only) per entity.

### Exit codes

| Exit | Meaning | CI behavior |
|-|-|-|
| 0 | No breaking, no additive (pure docs-only or unchanged) | Pass |
| 1 | Additive only (warning territory) | Surface but don't block merge |
| 2 | At least one breaking, OR a fatal error (parse / schemaVersion mismatch) | Block merge |

CI pipelines fail-fast on exit 2:

```bash
compodocx --exportFormat json -d /tmp/new-snapshot
compodocx diff --old ./baseline/documentation.json --new /tmp/new-snapshot/documentation.json --json > diff.json
# exit code carries the verdict; diff.json is the audit trail
```

### Schema-version gate

The diff runs against `schemaVersion: 1` only — the contract introduced in 0.3.0 (see § JSON export above). Pre-0.3.0 outputs have no `schemaVersion` field and fail the gate with:

```text
diff: <file> has no schemaVersion — re-export with compodocx ≥ 0.3.0
```

Re-export both sides with the same compodocx version and re-run.

### Volatile fields

`generatedAt` and `compodocxVersion` change on every export run regardless of source code; the comparator strips both before counting `unchanged`. The list lives in `VOLATILE_EXPORT_FIELDS` (exported from `@cngxjs/compodocx`); future fields added to the export header become volatile by being added to that constant.

### Output formats

- **Default (console).** Severity-sorted, colored tags, `--no-warnings` collapses to breaking-only.
- **`--json`.** Envelope: `{ schemaVersion, comparedAt, from, to, summary, changes[] }`. Pipe to `jq` for transformation.
- **`--md`.** CHANGELOG-ready section. Empty severity sections are dropped. Heading uses `compodocxVersion` from each snapshot's header.

### Limits — what does NOT diff

- **Cross-schema comparison.** When `schemaVersion` differs between `--old` and `--new`, the gate fails. Manual migration is required (re-export the older snapshot with the newer compodocx version).
- **Semantic-versioning recommendation.** The diff classifies changes; it does NOT advise "bump major" — leaves that to the consumer.
- **Diff against last git tag.** Both `--old` and `--new` are required file paths. No magic resolution.

## LLM context export (`--exportFormat llm-md`)

`compodocx --exportFormat llm-md` emits a single flat markdown file that captures the project's public API surface in a token-dense form. The intended use case is pasting the file into an AI context window so a model can answer questions about the project without re-discovering the codebase.

### Quick start

```bash
# Stream to stdout (cat/sed/awk convention — no -d)
compodocx -p tsconfig.json --exportFormat llm-md > my-project.md

# Write to <out>/llm-context.md when -d is provided
compodocx -p tsconfig.json --exportFormat llm-md -d ./ai-context

# Pipe straight into the clipboard
compodocx -p tsconfig.json --exportFormat llm-md | pbcopy
```

When `-d` is omitted, the markdown payload streams to stdout and every progress log routes to stderr. The Compodoc banner is suppressed unconditionally so `> file.md` redirects produce a clean payload.

### Output shape

A single document with the structure:

```markdown
# {project name}

> {package.json description}

> Generated by compodocx {version} at {ISO timestamp}, llm-md export.

## Modules
### AppModule
File: `src/app/app.module.ts`
declarations: `AppComponent`
imports: `BrowserModule`

## Components
### FooComponent
File: `src/app/foo.component.ts`
Selector: `app-foo`

Description: …

Inputs:
- `name: string` — required display name
- `disabled?: boolean = false` — when true, blocks interaction

Outputs:
- `selected: EventEmitter<FooEvent>`

Methods:
- `refresh(): Promise<void>` — reload from upstream

## Directives
## Pipes
## Services / Injectables
## Guards
## Interceptors
## Classes
## Interfaces
## Public functions
## Public type aliases
## Public enumerations
## Public variables
```

Empty sections are dropped. Inputs / outputs / properties / methods are bulleted lists with inline-coded signatures, not markdown tables — tables waste tokens for no model-comprehension gain.

### What is rendered

- Hero: heading, file path, framework metadata (selector, standalone, change detection, exportAs, providedIn, …).
- Description: collapsed to one line (newlines and HTML stripped, `{@link Foo}` flattened to `Foo`).
- Inputs / outputs / methods / properties: signatures via `name: type = default`, with optional `?` and `(deprecated: msg)` tail.
- Theme tokens (components only): inline list with type, default, and group tag.
- `@deprecated` markers on entities AND members.

### What is NOT rendered

- Source code, template HTML, style content (intentionally — too noisy for an LLM context).
- JSDoc trivia: `@since`, `@author`, `@example`. The `@example` content is dropped because fenced code in the middle of a context window confuses some models.
- HTML output. Pure markdown.
- Custom output templates. The format is fixed at v0.3.0 — file an issue if the surface needs a knob.

### Token-density safeguards

- Long signature values (types, default values, return types) are truncated at 160 characters with an ellipsis. Embedded base64 images and giant union literals would otherwise blow the file to multiple megabytes; for context, todomvc renders to ~35 KB with the cap, ~2 MB without.
- Multi-paragraph descriptions collapse to single sentences.
- Backticks and asterisks in user-provided strings are escaped before embedding so the markdown stays valid even when JSDoc contains literal markup.

### Limits — what does NOT export

- **Multi-file split.** A single document is the entire point — splitting defeats clipboard / paste workflows.
- **Token-budget enforcement.** Model context windows vary (8 K → 200 K+); trimming is the consumer's responsibility.
- **AI-assistant-specific dialects.** One neutral form ships; downstream tooling can transform via `marked` if a model prefers a different shape.

## Multi-version documentation

compodocx supports publishing documentation for multiple library versions side-by-side out of the box. Every URL in the generated output is relative, so running the CLI N times into N subdirectories under one deploy root produces a working multi-version site with no rewrite step or extra flag.

See [docs/versioned-docs.md](docs/versioned-docs.md) for the full pattern, deployment recipes (GitHub Pages, Netlify, Vercel, plain nginx), a drop-in version-switcher snippet, and current limitations.
