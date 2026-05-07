# Theme Tokens — Authoring Guide


## When to apply this guide

Use it when you are:

- adding a new theme token (custom property, SCSS variable, or `@property` rule) to a component
- retrofitting documentation onto an existing component stylesheet
- reviewing a component's stylesheet for a documentation pass
- generating a component scaffold that should ship with a documented theming surface from day one

If you only consume tokens (e.g. you are styling a page that uses someone else's component), this guide does not apply.

## Quick reference

This is the smallest possible cheat sheet. Skim this first; everything below is detail.

```scss
// SCSS variable
/// Description here.
/// @type Length
/// @default 8px
/// @group container
$padding: 8px !default;
```

```css
/* CSS custom property */
/**
 * Description here.
 * @type <color>
 * @default #fff
 * @group container
 */
:host {
    --bg: #fff;
}
```

```css
/* @property at-rule (recommended for runtime-typed tokens) */
/**
 * Description here.
 * @group container
 */
@property --gap {
    syntax: '<length>';
    inherits: true;
    initial-value: 12px;
}
```

```css
/* File-level intro */
/**
 * @overview
 * One-paragraph description of what this stylesheet exposes.
 * Multiple `@overview` blocks are concatenated in source order.
 */
```

The parser does the rest. The tokens land in the component's **Theming** tab, grouped by `@group`, with the type, default value, description, examples, and `@see` cross-links rendered automatically.

## Core mental model

The parser thinks like JSDoc, not like a CSS preprocessor. Three rules cover almost everything:

1. **Doc blocks attach to the next declaration.** A `///` block (SCSS) or `/** */` block (CSS) immediately above a `$variable: ...;`, `--property: ...;`, or `@property --name { ... }` describes that target. Anything between the block and the target — other than blank lines — breaks the association silently.

2. **`@overview` claims the block.** A doc block carrying the `@overview` tag is treated as a file-level intro and never associated with a following declaration. Use it for a one-paragraph description at the top of the file.

3. **Single-asterisk `/* */` blocks are invisible.** Only `/**` (two asterisks) opens a doc comment. SCSS `//` line comments (one or two slashes, not three) are also invisible.

That is the whole model. Everything else is tag semantics.

## Authoring patterns

### Pattern 1 — SCSS variable with SassDoc

Use `///` line comments (three slashes). Each line of the block continues the description until a `@tag` starts the tag block. The block must sit directly above the `$var: value [!default];` declaration; only blank lines may separate them.

```scss
/// Padding inside the alert container.
/// @type Length
/// @default 12px 16px
/// @group container
$alert-padding: 12px 16px !default;
```

Multiple variables in a row each need their own `///` block:

```scss
/// Inner radius of the alert container.
/// @type Length
/// @default 8px
/// @group container
$alert-radius: 8px !default;

/// Severity-specific danger background.
/// @type Color
/// @group severity
$alert-danger-bg: #fee2e2 !default;
```

### Pattern 2 — CSS custom property with JSDoc

Use `/** */` (two asterisks at the open, exactly). The block can sit either directly above the `--property:` declaration **or** above the wrapping selector when the selector has the property as its first inner declaration.

Both of these work and produce the same token:

```css
/* Doc above the property */
:host {
    /**
     * Background colour of the alert container.
     * @type <color>
     * @default #f8fafc
     * @group container
     */
    --cngx-alert-bg: #f8fafc;
}
```

```css
/* Doc above the wrapping selector */
/**
 * Background colour of the alert container.
 * @type <color>
 * @default #f8fafc
 * @group container
 */
:host {
    --cngx-alert-bg: #f8fafc;
}
```

The first form is preferred when a single `:host { }` block contains many properties — keeps each token's documentation next to its declaration. The second form is fine when a wrapping selector exists only to scope a single property.

### Pattern 3 — `@property` at-rule (recommended)

Native `@property` is the strongest pattern when your supported browsers allow it. The browser-native `syntax` populates the **Type** column and `initial-value` populates the **Default** column, so you do not need to repeat them in the doc block:

```css
/**
 * Inner gap between icon, body, and dismiss button.
 * @group container
 */
@property --cngx-alert-gap {
    syntax: '<length>';
    inherits: true;
    initial-value: 12px;
}
```

Explicit `@type` and `@default` tags still win over the browser-native descriptors when both are set — useful when you want to document the *intent* in human terms while keeping the runtime-checkable native version too:

```css
/**
 * @type Length (one to four values)
 * @default 12px 16px (vertical / horizontal)
 * @group container
 */
@property --cngx-alert-padding {
    syntax: '<length>+';
    inherits: true;
    initial-value: 12px 16px;
}
```

### Pattern 4 — File-level intro with `@overview`

A doc block carrying `@overview` becomes the first paragraph on the Theming tab, above the navigable index. Multiple `@overview` blocks across all resolved style files are concatenated in source order.

```css
/**
 * @overview
 * Theme tokens for the **alert** component. Override these in your
 * global stylesheet to retheme every alert at once. Severity-specific
 * tokens (`--cngx-alert-danger-bg` etc.) override the base values.
 */
```

The body uses Markdown — `**bold**`, `_italic_`, ` ``code`` `, `[links](url)`, `> blockquote`, lists. `{@link --cngx-alert-bg}` cross-links to the token's row.

## Tag reference

| Tag | Value | Effect |
|-|-|-|
| `@overview` | Markdown body, may span multiple lines | File-level intro paragraph rendered above the index. The tag claims the block — do NOT mix `@overview` with token-describing tags in the same block |
| `@type` | CSS type expression (`<length>`, `<color>`, `<length-percentage>+`, `Number`, `String`, free-form text) | Renders in the **Type** cell next to the token name |
| `@default` | Any string | Renders in the **Default** cell. Falls back to the literal declaration value when omitted; for `@property`, falls back to `initial-value` |
| `@group` | Identifier (kebab-case recommended: `container`, `severity`, `icon`) | Groups tokens under a sub-heading. Tokens without `@group` sit in a flat default bucket above all named groups |
| `@example` | Fenced code block, multi-line, repeatable | Rendered below the description as a Shiki-highlighted snippet. Format: `` ```css\n…\n``` ``. The language tag inside the fence drives highlighting |
| `@since` | Version string (`0.1.0`, `1.2.0-beta.3`) | Adds a small "since" badge next to the token name |
| `@deprecated` | Optional reason, free-form text | Strikes through the token name and renders the reason as muted prose. Bare `@deprecated` (no reason) still strikes the name |
| `@see` | URL, repeatable; OR token name (`--other-token`, `$other-var`), repeatable | Rendered as a comma-separated link list at the bottom of the description. Token references resolve to in-page anchors |

Unknown tags are preserved verbatim in the description as plain text. The parser never errors on a tag it does not know — feel free to layer your own conventions.

## Positioning rules

The parser is intentionally strict about position. These all **fail silently** (token not extracted):

```scss
/// Doc here
body { color: red; }      // Unrelated declaration breaks the chain
$padding: 8px;            // Token NOT documented
```

```css
/**
 * Doc here
 */
.unrelated { color: red; }  // Unrelated rule breaks the chain
:host { --foo: 1; }         // Property NOT documented
```

```css
/* Single-asterisk block — INVISIBLE to the parser */
:host { --foo: 1; }
```

These all **succeed**:

```scss
/// Doc here
$foo: 8px;                  // Direct association

/// Doc here

$bar: 8px;                  // Blank lines OK

/// Doc here
$baz: 8px !default;         // !default modifier OK
```

```css
/**
 * Doc here
 */
:host {
    --foo: 1;               // Doc above wrapper, single-prop body
}

:host {
    /**
     * Doc here
     */
    --foo: 1;               // Doc directly above prop (preferred)
}

/**
 * Doc here
 */
@property --foo {           // Doc above @property at-rule
    syntax: '<length>';
    inherits: true;
    initial-value: 8px;
}
```

## Source resolution

The parser walks every component and reads:

1. Each entry in the component's `styleUrls`, resolved relative to the component's `.ts` file.
2. Each string in the component's inline `styles[]` array, treated as anonymous CSS keyed `<inline-style-0>`, `<inline-style-1>`, ...
3. For SCSS files only, top-level `@import` and `@use` rules are followed **one level deep**. Use this for shared token partials:

```scss
// _tokens.scss (the partial)
/// Shared brand surface.
/// @type Color
/// @group brand
$brand-primary: #2563eb !default;
```

```scss
// alert.component.scss (the component stylesheet)
@use './tokens';

/// Alert-specific override.
/// @type Color
/// @group container
$alert-bg: $tokens.$brand-primary !default;
```

Both `$brand-primary` and `$alert-bg` end up on the alert's Theming tab.

Components without `styleUrls` and without inline `styles[]` produce zero tokens — the Theming tab is omitted automatically.

Non-component entities (services, directives without styles, classes, interfaces, pipes, guards, interceptors) never produce a Theming tab.

## Anti-patterns

These compile cleanly but produce no documentation. Audit for them when retrofitting:

| Anti-pattern | Symptom | Fix |
|-|-|-|
| `/* */` instead of `/** */` | Token missing from Theming tab; no parser error | Add the second asterisk |
| `//` instead of `///` (SCSS) | Token missing | Use three slashes |
| Doc block above an unrelated rule | Token after the doc not documented | Move the doc directly above its target, or remove the intervening rule |
| `@overview` mixed with `@type`/`@default` in the same block | Token not documented; the block becomes overview only | Split into two blocks: one `@overview`, one for the token |
| Missing `@group` on some tokens, set on others | Ungrouped tokens land in the flat default bucket above the named groups, may look "out of place" | Either group every token consistently or accept the flat-first layout intentionally |
| `@type Length` written as `@type "Length"` | Quotes appear in the rendered cell | Tags are free-form; do not quote |
| Multiple `@default` lines | Last one wins; the others are silently dropped | Use one `@default` per token |
| `@property --foo { syntax: '<color>'; ... }` with `@type Length` in the doc | Explicit `@type` overrides — the cell shows `Length` even though the runtime accepts `<color>` only | Match the doc to the runtime, or omit `@type` and let the merge fill it |
| Doc block placed below the declaration | Token not documented (parser only looks above) | Move the block above |

## Verification loop

After writing or editing a component's theme tokens:

1. Run `npm run build` (or whatever generates the docs in your project).
2. Open the component's documentation page.
3. Click the **Theming** tab. If the tab is missing entirely, no tokens were extracted.
4. Verify the index lists every token you documented.
5. For each token row, check the **Type** and **Default** cells render the expected values; check the description block renders Markdown correctly.
6. Open the collapsible **Source** panel at the bottom — your raw stylesheet should appear there. If a file you expected is missing, the resolver did not find it.

If something is wrong, the most common causes are listed in the anti-patterns table above.

## Recipe — minimal component theming surface

Copy-paste starting point for a brand-new component. Five tokens, two groups, an overview, and a deprecated alias:

```css
/**
 * @overview
 * Theme tokens for the **{{component-name}}** control. Override in a
 * global stylesheet to retheme every instance.
 */

/**
 * Background fill.
 * @type <color>
 * @default #f8fafc
 * @group container
 */
@property --{{component-prefix}}-bg {
    syntax: '<color>';
    inherits: true;
    initial-value: #f8fafc;
}

/**
 * Text colour.
 * @type <color>
 * @default inherit
 * @group container
 */
@property --{{component-prefix}}-color {
    syntax: '*';
    inherits: true;
    initial-value: inherit;
}

/**
 * Border radius.
 * @type <length>
 * @default 8px
 * @group container
 * @example css
 *   .{{component-prefix}}--sharp { --{{component-prefix}}-radius: 0; }
 */
@property --{{component-prefix}}-radius {
    syntax: '<length>';
    inherits: true;
    initial-value: 8px;
}

/**
 * Icon size (width and height).
 * @type <length>
 * @default 20px
 * @group icon
 * @since 0.1.0
 */
@property --{{component-prefix}}-icon-size {
    syntax: '<length>';
    inherits: true;
    initial-value: 20px;
}

/**
 * @deprecated Use --{{component-prefix}}-color instead.
 */
@property --{{component-prefix}}-text-color {
    syntax: '*';
    inherits: true;
    initial-value: currentColor;
}
```

## Recipe — retrofit an existing stylesheet

You have an existing component CSS with custom properties but no documentation. Convert it incrementally:

```css
/* BEFORE */
:host {
    --cngx-alert-bg: #f8fafc;
    --cngx-alert-color: inherit;
    --cngx-alert-padding: 12px 16px;
    --cngx-alert-radius: 8px;
}
```

```css
/* AFTER */
/**
 * @overview
 * Theme tokens for the alert component.
 */
:host {
    /**
     * Background fill of the alert container.
     * @type <color>
     * @default #f8fafc
     * @group container
     */
    --cngx-alert-bg: #f8fafc;

    /**
     * Text colour of the alert body.
     * @type <color>
     * @default inherit
     * @group container
     */
    --cngx-alert-color: inherit;

    /**
     * Padding of the alert container.
     * @type <length-percentage>+
     * @default 12px 16px
     * @group container
     */
    --cngx-alert-padding: 12px 16px;

    /**
     * Corner radius of the alert container.
     * @type <length>
     * @default 8px
     * @group container
     */
    --cngx-alert-radius: 8px;
}
```

Migrating to `@property` is a separate, optional step. Do it once the inline-doc retrofit is in place.

## Recipe — common cross-references

```css
/**
 * Severity-specific danger background. Inherits the base
 * {@link --cngx-alert-bg} when not set.
 * @type <color>
 * @default #fee2e2
 * @group severity
 * @see --cngx-alert-bg
 * @see https://example.com/docs/alert#danger
 */
@property --cngx-alert-danger-bg {
    syntax: '<color>';
    inherits: true;
    initial-value: #fee2e2;
}
```

`{@link --cngx-alert-bg}` inside the description renders as inline code linked to the other token's row. `@see` entries appear as a comma-separated footer; URLs open in a new tab, token names link to in-page anchors.

## What this guide does NOT cover

These are intentionally out of scope as of compodocx 0.1.0-dev — do not try to document them and expect them to surface:

- SCSS `@mixin` and `@function` declarations. Tokens only.
- CSS `@layer` and `@scope` introspection.
- Transitive `@import` / `@use` resolution beyond one level. Keep token partials a single hop away from the component stylesheet.
- Token usage graphs (which component consumes which token from another component's surface).
- Validation of `@type` against the actual declaration value. The parser trusts you.
- Auto-detection of undocumented tokens. Tokens without a doc block are intentionally invisible — same convention as undocumented JSDoc on TypeScript members.

## Related references

- `docs/configuration.md` → "Theming Tab" section: the user-facing reference for the tag set and the resolution rules.
- `docs/custom-templates.md` → "Block-level overrides": how to replace the default rendering for the whole panel (`block-theming`) or a single row (`block-theming-token`).
- `src/utils/theme-doc-parser.ts`: the parser itself. Read this if you suspect a parser bug or want to understand an edge case.
- `src/templates/blocks/BlockTheming.tsx`: the renderer. Read this to know exactly which markup ends up in the page.
