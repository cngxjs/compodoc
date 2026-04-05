# Coverage Redesign Design Spec

> Phase 5, Tier 1, Item 1.5
> Replaces the aggressive red/green Bootstrap table with a summary dashboard + grouped sortable tables.

## Decisions

| Decision | Choice | Rationale |
|-|-|-|
| Chart | Pure SVG donut (server-rendered TSX) | Zero JS, accessible, themed via CSS vars |
| Sorting | Custom vanilla TS in client bundle | Replaces vendored tablesort.js, typed, styled |
| Grouping | By entity type | Matches sidebar, data already has `type` field |
| Severity | Implicit sort (exported first) + muted style for internal | No extra column, priority baked into order |

## Page Structure

```
.cdx-breadcrumb (Coverage)

.cdx-coverage-summary                    ← card: border, radius-lg, bg-alt
  ├── .cdx-coverage-donut               ← SVG donut, ~120px
  │     center: percentage text (large)
  │     two arcs: documented (primary) / undocumented (muted)
  │     <title> + <desc> for a11y
  │     role="img"
  ├── .cdx-coverage-stats               ← 2x2 grid
  │     Total entities | Documented
  │     Undocumented   | Files
  └── (badge image removed — redundant with donut)

.cdx-coverage-filter                     ← search input, filters all groups
  placeholder: "Filter entities..."
  aria-label: "Filter coverage results"

<details open class="cdx-coverage-group">  ← one per entity type (with entities)
  <summary class="cdx-coverage-group-header">
    ├── .cdx-badge--entity-{type}        ← reuse existing badge
    ├── group name ("Components")
    ├── .cdx-coverage-bar-mini           ← inline progress bar ~100px
    ├── fraction text ("12/15")
    └── chevron (CSS rotate on [open])
  </summary>

  <table class="cdx-coverage-table">
    <thead>
      <tr>
        <th data-sort="name">Identifier</th>     ← clickable sort
        <th data-sort="file">File</th>            ← hides below 500px
        <th data-sort="coverage">Coverage</th>    ← default sort (ascending)
      </tr>
    </thead>
    <tbody>
      <tr>                                         ← exported entity (normal)
        <td><a href="...">EntityName</a></td>
        <td class="cdx-coverage-file">path/to/file.ts</td>
        <td>
          .cdx-coverage-bar (thin progress bar, colored by threshold)
          + percentage text
        </td>
      </tr>
      <tr class="cdx-coverage-row--internal">     ← internal entity (muted + italic)
        ...
      </tr>
    </tbody>
  </table>
</details>
```

## Summary Dashboard

### SVG Donut

Server-rendered in TSX. Two `<circle>` elements with `stroke-dasharray` / `stroke-dashoffset` to create arcs:

```
<svg viewBox="0 0 120 120" class="cdx-coverage-donut" role="img">
  <title>Documentation coverage: {pct}%</title>
  <desc>{documented} of {total} entities documented</desc>
  <!-- background ring -->
  <circle cx="60" cy="60" r="50" fill="none"
    stroke="var(--color-cdx-border)" stroke-width="10" />
  <!-- coverage arc -->
  <circle cx="60" cy="60" r="50" fill="none"
    stroke="var(--color-cdx-primary)" stroke-width="10"
    stroke-dasharray="{circumference}"
    stroke-dashoffset="{offset}"
    stroke-linecap="round"
    transform="rotate(-90 60 60)" />
  <!-- center text -->
  <text x="60" y="60" text-anchor="middle" dominant-baseline="central"
    class="cdx-coverage-donut-pct">{pct}%</text>
</svg>
```

Circumference = 2 * pi * 50 = ~314.16. Offset = circumference * (1 - pct/100).

### Stat Cards

Four numbers in a `.cdx-coverage-stats` 2x2 grid:

| Stat | Value | Color |
|-|-|-|
| Total | `files.length` | `--color-cdx-text` |
| Documented | count where `coveragePercent === 100` | `--color-cdx-entity-component` (teal/green) |
| Undocumented | count where `coveragePercent === 0` | `--color-cdx-text-muted` |
| Partial | count where `0 < pct < 100` | `--color-cdx-entity-service` (amber) |

Each stat: large number (1.5rem, 700 weight) + small label below (0.75rem, muted).

## Grouped Tables

### Group Order

Render groups in this order (matching sidebar). Skip groups with zero entities:

1. Components
2. Directives
3. Pipes
4. Services (injectables)
5. Classes
6. Interfaces
7. Guards
8. Interceptors
9. Type aliases

### Group Header

- Entity badge (`.cdx-badge--entity-{type}`) from badge system
- Group name (plural)
- Mini progress bar: thin (4px height), rounded, shows group coverage %
- Fraction: "12/15 documented"
- Native `<details open>` for collapse (same pattern as member cards)

### Table Columns

| Column | Content | Sort | Responsive |
|-|-|-|-|
| Identifier | Entity name as link to doc page | Alphabetical | Always visible |
| File | Relative path, monospace, ellipsis | Alphabetical | Hidden below 500px |
| Coverage | Progress bar + percentage | Numeric (default, ascending) | Always visible |

### Sort Behavior

- Default: coverage ascending (worst first)
- Click column header to sort; active column gets arrow indicator
- Within same coverage %, exported entities sort above internal
- Arrow toggles asc/desc on repeated click
- `aria-sort="ascending|descending|none"` on `<th>`

### Progress Bar Colors

Thin bar (4px height, full row width, rounded):

| Range | Color |
|-|-|
| 0% | `--color-cdx-border` (empty, just the track) |
| 1-33% | `--color-cdx-entity-service` (amber) |
| 34-66% | `--color-cdx-primary` (blue) |
| 67-99% | `--color-cdx-entity-component` (teal) |
| 100% | `--color-cdx-entity-component` (teal, full) |

No full-row background coloring. The bar carries the color signal.

### Internal Entity Style

Internal (non-exported) entities: `.cdx-coverage-row--internal`
- Name text: `color: var(--color-cdx-text-muted); font-style: italic`
- Sorts below exported entities at same coverage %

Note: The current `CoverageFile` type does not have an `exported` field. We need to add this flag in `application.ts` where coverage data is assembled. If adding the field is too invasive for this phase, fall back to rendering all entities equally (no internal/exported distinction) and add it later.

## Filter

Client-side text filter in the client bundle:
- Input above group sections
- Filters rows by identifier name or file path (case-insensitive substring match)
- Groups with zero visible rows after filtering: hide entirely
- Debounced (150ms) to avoid jank on fast typing
- Clears with an "x" button or Escape key

## Empty States

### Zero entities (no coverage data at all)
- Donut shows empty ring (full undocumented color)
- Stats show zeros
- Table area replaced with `EmptyState` component (from 1.1)

### Zero entities in a type
- That group simply doesn't render (no empty state per group)

### Filter returns no results
- Show a brief "No matching entities" message in place of tables

## Responsive

Below 500px container width:
- Summary dashboard stacks vertically (donut on top, stats below)
- "File" column hidden
- Progress bars shrink but remain visible
- Group headers: badge + name on one line, bar + fraction below

## Accessibility

- Donut SVG: `role="img"`, `<title>`, `<desc>`
- Progress bars: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- Sort buttons: `aria-sort` attribute on active `<th>`
- Filter input: `aria-label="Filter coverage results"`
- `prefers-reduced-motion`: disable bar transitions, sort transitions
- Color is never the only indicator (percentage text always accompanies bars)

## Dark Mode

- Donut ring: `--color-cdx-border` adapts automatically
- Coverage arc: `--color-cdx-primary` adapts
- Stat card numbers: entity color tokens adapt
- Progress bar track: `--color-cdx-border` at 30% opacity
- Table hover: `color-mix(in srgb, var(--color-cdx-border) 12%, transparent)` (same as metadata card)

## Files to Change

| File | Change |
|-|-|
| `src/templates/pages/CoverageReport.tsx` | Full rewrite: summary + grouped tables |
| `src/styles/components/coverage.css` | New: all `.cdx-coverage-*` styles |
| `src/styles/compodocx.css` | Add `@import "./components/coverage.css"` |
| `src/client/coverage.ts` | New: sort + filter logic |
| `src/client/compodocx.ts` | Import + init coverage module |
| `src/resources/js/libs/tablesort.min.js` | Delete |
| `src/resources/js/libs/tablesort.number.min.js` | Delete |
| `src/templates/pages/UnitTestReport.tsx` | Migrate from tablesort to shared sort module |
| `src/resources/styles/compodocx.css` | Compiled output updates |

## CSS Classes

All prefixed with `cdx-coverage-`:

| Class | Element |
|-|-|
| `.cdx-coverage-summary` | Summary card container |
| `.cdx-coverage-donut` | SVG donut |
| `.cdx-coverage-donut-pct` | Center percentage text |
| `.cdx-coverage-stats` | 2x2 stat grid |
| `.cdx-coverage-stat` | Individual stat card |
| `.cdx-coverage-stat-value` | Large number |
| `.cdx-coverage-stat-label` | Small label |
| `.cdx-coverage-filter` | Filter input wrapper |
| `.cdx-coverage-group` | `<details>` group |
| `.cdx-coverage-group-header` | `<summary>` bar |
| `.cdx-coverage-bar-mini` | Mini progress bar in group header |
| `.cdx-coverage-table` | Table element |
| `.cdx-coverage-file` | File path cell |
| `.cdx-coverage-bar` | Full progress bar in table row |
| `.cdx-coverage-bar-fill` | Progress bar fill element |
| `.cdx-coverage-row--internal` | Internal entity row |

## E2E Test Plan

Test against todomvc-ng2 fixture (port 4001):

1. Summary dashboard visible with donut + stats
2. Donut SVG has `role="img"` and `<title>`
3. Stat values are numeric
4. At least one coverage group rendered
5. Group headers show entity badge + progress bar
6. Groups are collapsible (`<details>`)
7. Table rows link to entity pages
8. Progress bars have `role="progressbar"` + aria attributes
9. No Bootstrap `table.table-bordered.coverage` remains
10. No `tablesort.min.js` script tags
11. Filter input filters rows (type text, check row visibility)
12. Sort click changes row order
13. Responsive: file column hidden at 400px viewport
14. Empty group types don't render

## Migration Note: UnitTestReport

`UnitTestReport.tsx` also uses tablesort. When we delete the vendor scripts, we must migrate it to use the same shared sort module from `src/client/coverage.ts`. The sort logic should be generic enough to work on any `<table>` with `data-sort` headers. The UnitTestReport visual redesign is out of scope for this item -- just swap the sort mechanism.
