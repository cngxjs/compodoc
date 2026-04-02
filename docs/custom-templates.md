# Custom templates

Compodocx supports custom templates via the `--templates` flag. You can override any page or the sidebar menu by providing JavaScript files that return HTML strings.

## Quick start

```bash
compodocx -p src/tsconfig.json --templates ./my-templates
```

Directory structure:

```
my-templates/
  partials/
    component.js      # overrides the component detail page
    overview.js        # overrides the overview page
    menu.js            # overrides the sidebar menu
    ...
```

## Writing a custom template

Each `.js` file exports a function that receives the page data and a helpers object:

```js
module.exports = function(data, helpers) {
    const c = data.component;
    return `
        <h1>${c.name}</h1>
        <p>${helpers.t('file')}: <code>${c.file}</code></p>
        ${c.description ? helpers.parseDescription(c.description, data.depth) : ''}
    `;
};
```

The function must return an HTML string. This string is placed inside the page layout (header, sidebar, footer are not affected unless you override `menu.js`).

## Available template names

These file names correspond to page contexts. Place them in `partials/` inside your templates directory.

| File name | Overrides |
|-|-|
| `overview.js` | Overview page |
| `modules.js` | Modules list page |
| `module.js` | Single module detail |
| `component.js` | Component detail page |
| `directive.js` | Directive detail page |
| `injectable.js` | Injectable/service detail |
| `interceptor.js` | Interceptor detail |
| `guard.js` | Guard detail |
| `pipe.js` | Pipe detail |
| `class.js` | Class detail |
| `interface.js` | Interface detail |
| `entity.js` | Entity detail |
| `routes.js` | Routes page |
| `markdown.js` | Markdown pages (readme, changelog, etc.) |
| `additional-page.js` | Additional documentation pages |
| `coverage-report.js` | Documentation coverage report |
| `unit-test-report.js` | Unit test coverage report |
| `package-dependencies.js` | Package dependencies page |
| `package-properties.js` | Package properties page |
| `miscellaneous-functions.js` | Miscellaneous functions |
| `miscellaneous-variables.js` | Miscellaneous variables |
| `miscellaneous-typealiases.js` | Miscellaneous type aliases |
| `miscellaneous-enumerations.js` | Miscellaneous enumerations |
| `menu.js` | Sidebar navigation menu |

## Available helpers

The second argument passed to your template function contains all built-in helpers:

```js
module.exports = function(data, helpers) {
    // Translation
    helpers.t('key')                    // translate an i18n key

    // Type resolution and links
    helpers.linkTypeHtml('MyService')   // renders <code><a href="...">MyService</a></code>
    helpers.resolveType('MyService')    // returns { href, raw, target } or null

    // Descriptions with @link resolution
    helpers.parseDescription(text, depth)

    // Function/method signatures with type links
    helpers.functionSignature(methodObj)

    // JSDoc extraction
    helpers.extractJsdocParams(jsdocTags)      // @param tags as structured objects
    helpers.extractJsdocCodeExamples(jsdocTags) // @example tags with code fence parsing
    helpers.jsdocReturnsComment(jsdocTags)      // @returns comment string
    helpers.hasJsdocParams(jsdocTags)           // boolean: has @param tags?

    // Modifier display
    helpers.modifKind(syntaxKind)       // "Private", "Static", etc.
    helpers.modifIcon(syntaxKind)       // "lock", "reset", etc.

    // Tab/section checks
    helpers.isTabEnabled(navTabs, 'info')
    helpers.isInitialTab(navTabs, 'info')
    helpers.isInfoSection('methods')

    // Utilities
    helpers.capitalize('text')
    helpers.relativeUrl(depth)
    helpers.shortUrl('src/app/foo/bar.ts')
    helpers.indexableSignature(method)
    helpers.oneParameterHas(tags, 'type')
    helpers.parseProperty(value)
};
```

## Data object

The `data` object contains the full page context. Its shape depends on the page type. Common fields:

```js
data.context              // page type: 'component', 'directive', etc.
data.depth                // nesting depth (0 = root, 1 = one level deep)
data.navTabs              // available tabs for this page
data.documentationMainName // project name
data.disableFilePath      // boolean: hide file paths?
```

Entity pages (component, directive, class, etc.) have the entity data under their type key:

```js
data.component.name       // component name
data.component.file       // source file path
data.component.selector   // CSS selector
data.component.description // description HTML
data.component.methods    // method list
data.component.properties // property list
data.component.sourceCode // source code string
// ... etc.
```

For the menu override, `data` contains the full main data with all modules, components, directives, etc.

## Migrating from Handlebars templates

If you have existing `.hbs` custom templates, convert them to `.js`:

### Syntax mapping

| Handlebars | JavaScript |
|-|-|
| `{{variable}}` | `${data.variable}` |
| `{{{rawHtml}}}` | `${data.rawHtml}` |
| `{{#if x}}...{{/if}}` | `${x ? \`...\` : ''}` |
| `{{#unless x}}...{{/unless}}` | `${!x ? \`...\` : ''}` |
| `{{#each items}}...{{/each}}` | `${items.map(item => \`...\`).join('')}` |
| `{{t "key"}}` | `${helpers.t('key')}` |
| `{{> link-type type=x}}` | `${helpers.linkTypeHtml(x)}` |
| `{{parseDescription desc depth}}` | `${helpers.parseDescription(desc, depth)}` |
| `{{{functionSignature method}}}` | `${helpers.functionSignature(method)}` |
| `{{#compare a "===" b}}...{{/compare}}` | `${a === b ? \`...\` : ''}` |
| `{{modifKind kind}}` | `${helpers.modifKind(kind)}` |

### Step-by-step

1. Rename `.hbs` files to `.js`
2. Wrap content in `module.exports = function(data, helpers) { return \`...\`; };`
3. Replace `{{variable}}` with `${data.variable}` (or the appropriate entity key like `data.component.variable`)
4. Replace Handlebars helpers with `helpers.*` calls
5. Replace `{{#if}}` / `{{#each}}` blocks with JavaScript ternaries and `.map()`
6. Note: `component-detail.hbs` is now `component.js` (the detail partial was merged into the page)

### Example

Before (`component-detail.hbs`):
```handlebars
{{#if component.selector}}
<h3>Selector</h3>
<code>{{component.selector}}</code>
{{/if}}

{{#if component.description}}
<h3>Description</h3>
{{{parseDescription component.description depth}}}
{{/if}}
```

After (`component.js`):
```js
module.exports = function(data, helpers) {
    const c = data.component;
    let html = '';

    if (c.selector) {
        html += `<h3>Selector</h3><code>${c.selector}</code>`;
    }

    if (c.description) {
        html += `<h3>Description</h3>${helpers.parseDescription(c.description, data.depth)}`;
    }

    return html;
};
```
