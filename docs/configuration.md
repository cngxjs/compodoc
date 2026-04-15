# Compodocx Configuration Reference

Compodocx generates static HTML documentation for Angular projects by analyzing TypeScript source code. Every aspect of the output can be configured through three methods:

1. **CLI flags** -- pass options directly when running `compodocx` or `compodoc`
2. **Config file** -- `.compodocxrc`, `.compodocxrc.json`, `.compodocxrc.yaml` (also supports legacy `.compodocrc` variants)
3. **package.json** -- under a `compodocx` or `compodoc` property

Options are resolved in this order: CLI flags override config file values, which override defaults. The config file is auto-discovered in the project root unless explicitly specified with `-c`.

## Quick Start

```bash
# Minimal: generate docs from a tsconfig
compodocx -p src/tsconfig.json

# Generate, serve, and watch for changes
compodocx -p src/tsconfig.json -s -w

# Custom output folder and title
compodocx -p src/tsconfig.json -d ./docs -n "My Project"

# Minimal mode (no search, no graphs, no coverage)
compodocx -p src/tsconfig.json --minimal
```

Example `.compodocxrc.json`:

```json
{
    "tsconfig": "src/tsconfig.json",
    "output": "./documentation",
    "name": "My Angular Project",
    "theme": "ocean",
    "disablePrivate": true,
    "language": "de-DE"
}
```

---

## General

These options control the basic identity and language of the generated documentation.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| name | `-n, --name` | string | `'Application documentation'` | Title shown in the sidebar header and browser tab. Also used in the `<title>` element of every generated page |
| language | `--language` | string | `'en-US'` | UI language for all labels, headings, and navigation. Available: bg-BG, de-DE, en-US, es-ES, fr-FR, hu-HU, it-IT, ja-JP, ka-GE, ko-KR, nl-NL, pl-PL, pt-BR, ru-RU, sk-SK, zh-CN, zh-TW |
| config | `-c, --config` | string | -- | Explicit path to a config file. If omitted, compodocx searches for `.compodocxrc`, `.compodocxrc.json`, `.compodocxrc.yaml`, or a `compodocx`/`compodoc` key in `package.json` |
| tsconfig | `-p, --tsconfig` | string | -- | Path to the project's `tsconfig.json`. This is required -- compodocx uses the TypeScript compiler to analyze the source |

## Output

Controls where and how the documentation is generated.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| output | `-d, --output` | string | `'./documentation/'` | Directory for the generated static site. Created if it doesn't exist. Contents are overwritten on each run |
| exportFormat | `-e, --exportFormat` | string | `'html'` | Output format. `html` generates a full static site. `json` exports the parsed data model as JSON files (useful for custom tooling) |
| base | -- | string | `'/'` | Base URL path prepended to all generated links. Set this when hosting docs in a subdirectory (e.g. `'/my-project/'`) |

## Serving

Compodocx includes a built-in dev server for previewing documentation locally.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| serve | `-s, --serve` | boolean | `false` | Start a local HTTP server after generation. Serves the output directory |
| port | `-r, --port` | number | `8080` | Port for the dev server |
| host | `--host` | string | `'127.0.0.1'` | Host address. Set to `0.0.0.0` to expose on the network |
| watch | `-w, --watch` | boolean | `false` | Watch the documented project's source files and rebuild documentation on changes. Requires `--serve`. This watches the *target project*, not compodocx's own source -- for compodocx development, use `npm run dev` instead |
| open | `-o, --open` | boolean | `false` | Automatically open the documentation in the default browser after serving |

## Theming

Compodocx ships with multiple built-in themes and supports custom CSS. All themes support light and dark mode.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| theme | `--theme` | string | `'default'` | Built-in theme name or path to a custom CSS file. Built-in themes: `default`, `ocean`, `ember`, `midnight`, `neon`, `brutalist`, `nord`, `rose-pine`. A custom CSS file is loaded *instead of* the built-in theme |
| extTheme | `-y, --extTheme` | string | -- | **Deprecated** -- use `--theme` instead. When set and no `--theme` is provided, treated as a custom theme path. Does not load an additional stylesheet |
| shikiTheme | `--shikiTheme` | string | `'github-light:github-dark'` | Shiki syntax highlighting theme pair for code blocks. Format: `'light-theme:dark-theme'` or a single theme name used for both modes. Uses [Shiki's bundled themes](https://shiki.style/themes). Applies to both the Source Viewer and inline code snippets |
| customFavicon | `--customFavicon` | string | -- | Path to a custom favicon file. Copied into the output and referenced in the HTML `<head>` |
| customLogo | `--customLogo` | string | -- | Path to a custom logo image displayed in the sidebar header |
| hideGenerator | `--hideGenerator` | boolean | `false` | Remove the "Built with compodocx" link in the page footer |
| hideDarkModeToggle | `--hideDarkModeToggle` | boolean | `false` | Remove the light/dark mode toggle button from the top-right header area |

## Visibility Filters

These flags control which class members and entity details appear in the documentation. They filter at the member level -- the entity page still exists, but specific sections are hidden.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| disablePrivate | `--disablePrivate` | boolean | `false` | Hide `private` members from all entity pages. Affects properties, methods, and accessors marked `private` |
| disableProtected | `--disableProtected` | boolean | `false` | Hide `protected` members from all entity pages |
| disableInternal | `--disableInternal` | boolean | `false` | Hide members marked with the `@internal` JSDoc tag. Useful for public-facing documentation |
| disableLifeCycleHooks | `--disableLifeCycleHooks` | boolean | `false` | Hide Angular lifecycle hooks (`ngOnInit`, `ngOnDestroy`, etc.) from method listings |
| disableConstructors | `--disableConstructors` | boolean | `false` | Hide the constructor section from entity pages |
| disableProperties | `--disableProperties` | boolean | `false` | Hide the entire properties section (inputs, outputs, and regular properties) |
| disableDependencies | `--disableDependencies` | boolean | `false` | Hide the dependencies section on the Info tab. This section shows `inject()` calls and constructor-injected services |
| disableFilePath | `--disableFilePath` | boolean | `false` | Hide the source file path shown in the entity hero area |
| showEffects | `--showEffects` | boolean | `false` | Show Angular `effect()` entries in a dedicated "Effects" block on the API tab. When disabled (default), effects appear as regular properties. Opt-in because effects are implementation details in most projects |
| publicApiOnly | `--publicApiOnly` | string | -- | Restrict documentation to symbols exported from `index.d.ts` files in the given dist folder. Only these symbols (and their dependencies) are documented. Useful for library authors who want to document only the public API |

## Feature Toggles

These flags disable entire features, tabs, or pages. Unlike visibility filters which hide individual members, these remove whole sections of the documentation.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| disableSourceCode | `--disableSourceCode` | boolean | `false` | Remove the Source tab from all entity pages and hide all "Defined in" source links. No source code is included in the output |
| disableDomTree | `--disableDomTree` | boolean | `false` | Remove the DOM Tree tab from component pages |
| disableTemplateTab | `--disableTemplateTab` | boolean | `false` | Remove the Template tab from component pages |
| disableStyleTab | `--disableStyleTab` | boolean | `false` | Remove the Style tab from component pages |
| disableGraph | `--disableGraph` | boolean | `false` | Remove all dependency graphs -- both the overview page graph and per-component dependency tabs |
| disableMainGraph | `--disableMainGraph` | boolean | `false` | Remove only the main overview dependency graph. Per-component dependency tabs remain |
| disableDependenciesTab | `--disableDependenciesTab` | boolean | `false` | Remove the per-component Dependencies tab that shows the standalone import graph. The overview graph and other graphs are not affected |
| disableRoutesGraph | `--disableRoutesGraph` | boolean | `false` | Remove the routes graph page. The page visualizes the Angular router configuration as a tree |
| disableSearch | `--disableSearch` | boolean | `false` | Remove the Pagefind search functionality. Disables the command palette (Ctrl+K), the search input, and skips Pagefind index generation at build time |
| disableCoverage | `--disableCoverage` | boolean | `false` | Remove the documentation coverage report page. Coverage measures how many public members have JSDoc descriptions |
| disableOverview | `--disableOverview` | boolean | `false` | Remove the overview/dashboard page that shows project-level statistics and the main dependency graph |
| minimal | `--minimal` | boolean | `false` | Shorthand that disables search, all graphs, and the coverage report in one flag. Equivalent to `--disableSearch --disableGraph --disableCoverage` |

## Navigation

Controls sidebar behavior and entity page tab configuration.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| toggleMenuItems | `--toggleMenuItems` | string[] | `['all']` | Sidebar sections that start collapsed. Pass `'all'` to collapse everything, or a comma-separated list of specific sections: `modules`, `components`, `directives`, `entities`, `classes`, `injectables`, `guards`, `interfaces`, `interceptors`, `pipes`, `miscellaneous`, `additionalPages` |
| navTabConfig | `--navTabConfig` | object[] | `[]` | Customize the order and labels of entity page tabs. Array of `{ id, label }` objects. Available tab IDs: `info` (overview/metadata), `readme` (component README), `source` (source code), `templateData` (component template), `styleData` (component styles), `tree` (DOM tree), `example` (live examples). Tabs not listed are hidden. If empty (default), all applicable tabs are shown in their default order |

## Coverage

Compodocx tracks documentation coverage -- the percentage of public members that have JSDoc descriptions. These options configure thresholds and reporting.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| coverageTest | `--coverageTest` | number | `70` | Global documentation coverage threshold as a percentage. Used in CI to enforce minimum documentation |
| coverageMinimumPerFile | `--coverageMinimumPerFile` | number | `0` | Per-file minimum coverage percentage. Each file must meet this threshold individually |
| coverageTestThresholdFail | `--coverageTestThresholdFail` | boolean | `true` | When `true`, a coverage threshold breach exits with a non-zero code (fails CI). When `false`, only a warning is printed |
| coverageTestShowOnlyFailed | `--coverageTestShowOnlyFailed` | boolean | `false` | In coverage output, show only files that fall below the threshold |
| unitTestCoverage | `--unitTestCoverage` | string | -- | Path to an Istanbul JSON coverage summary file (`coverage-summary.json`). When provided, unit test coverage data is integrated into the documentation coverage report, showing both documentation and test coverage side by side |

## Additional Content

Include external documentation, static assets, or enable the template customization playground.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| includes | `--includes` | string | -- | Path to a folder of external markdown files. Each `.md` file becomes a page in the documentation, accessible via a dedicated sidebar section. Supports nested folders for sub-navigation |
| includesName | `--includesName` | string | `'Additional documentation'` | Sidebar label for the external markdown pages section |
| assetsFolder | `-a, --assetsFolder` | string | -- | Path to a folder of static assets (images, files) copied into the output directory. Referenced from markdown or custom templates via relative paths |
| templates | `--templates` | string | -- | Path to a directory containing JS template overrides. Each file exports a function `(data, helpers) => string` that replaces the corresponding built-in template. See [Custom Templates](custom-templates.md) for the full API |
| templatePlayground | `--templatePlayground` | boolean | `false` | Generate a Template Playground page that lets users experiment with template overrides interactively. Adds a special page with a code editor and live preview |

## Sidebar Grouping

Controls how entities are organized in the sidebar. By default, compodocx auto-detects the best strategy based on the project structure.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| groupBy | `--groupBy` | string | auto-detect | Sidebar grouping strategy. `folder` groups entities by their directory path (e.g. `users/components`). `category` groups by the `@category` JSDoc tag. `none` shows a flat alphabetical list. When omitted, compodocx auto-detects: projects with NgModules default to `none`, standalone projects default to `folder` |
| groupDepth | `--groupDepth` | string | `'2'` | Maximum folder depth for group names when using `folder` grouping. A depth of `2` turns `src/app/users/components/user-card.component.ts` into the group `users/components`. Increase for deeply nested projects |

## Analytics

Integrate Google Analytics 4 (gtag.js) tracking into the generated documentation. Both SPA-style navigation and full page loads are tracked.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| gaID | `--gaID` | string | -- | Google Analytics 4 measurement ID (e.g. `G-XXXXXXXXXX`). When set, the gtag.js script is injected into every page |

## StackBlitz Integration

Enable live code examples powered by StackBlitz. When enabled, `@example` JSDoc tags with code blocks can be opened in StackBlitz directly from the documentation.

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| stackblitz | `--stackblitz` | boolean | `false` | Enable StackBlitz integration. Adds "Open in StackBlitz" buttons to code examples |
| stackblitzTemplate | `--stackblitzTemplate` | string | -- | StackBlitz project template ID. The example code is injected into this template when the user clicks "Open in StackBlitz" |

## Search

Compodocx uses [Pagefind](https://pagefind.app/) for client-side search. The search index is generated at build time by scanning the output HTML. Users access it via the command palette (Ctrl+K / Cmd+K).

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| maxSearchResults | `--maxSearchResults` | number | `15` | Maximum number of results shown in the search command palette. Set to `0` to show all results (may be slow for large projects) |

## Logging

| Option | CLI | Type | Default | Description |
|-|-|-|-|-|
| silent | `-t, --silent` | boolean | `false` | Suppress all console output during generation. Useful in CI pipelines where only the exit code matters |

---

## Entity Page Structure

Each documented entity (component, directive, service, class, etc.) gets a detail page with two main tabs:

**Info tab** -- Overview information: import statement, deprecation banner, description, JSDoc examples, decorator metadata, host bindings, providers, dependencies (inject/constructor DI), and relationship graph.

**API tab** -- Member surface: index grid, inputs, outputs, derived state (computed/linkedSignal), properties, methods, accessors, index signatures, host bindings, host listeners.

Additional tabs (Source, Template, Style, DOM Tree, README, Example) appear based on the entity type and available data. Tab visibility and order can be controlled via `navTabConfig`.

## JSDoc Tags

Compodocx recognizes these custom JSDoc tags on any entity or member:

| Tag | Effect |
|-|-|
| `@since <version>` | Adds a version badge to the entity hero |
| `@beta` | Adds a "Beta" badge |
| `@breaking <version>` | Adds a "Breaking" badge with version |
| `@internal` | Hides the member when `--disableInternal` is set |
| `@category <name>` | Groups the entity under this category when `--groupBy category` |
| `@storybook <url>` | Adds a Storybook link in the entity hero |
| `@figma <url>` | Adds a Figma link in the entity hero |
| `@stackblitz <url>` | Adds a StackBlitz link in the entity hero |
| `@github <url>` | Adds a GitHub link in the entity hero |
| `@docs <url>` | Adds a documentation link in the entity hero |
| `@example` | Code examples rendered in the Info tab with syntax highlighting |
