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
| `-e`, `--exportFormat` | unchanged | `json` and `html` are still the supported formats. |
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

## Future: `compodocx migrate`

A `compodocx migrate` CLI tool is planned for 0.2.0 — a one-shot command that reads a compodoc Handlebars template directory and emits the closest JavaScript equivalent for each `.hbs` file. For 0.0.1 the migration is manual; the cookbook above is the reference.

If you have a specific `.hbs` partial you would like covered by an automated migration, or a question about a non-trivial pattern not covered here, please open an issue at <https://github.com/cngxjs/compodocx/issues>.
