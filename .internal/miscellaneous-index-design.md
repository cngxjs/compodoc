# Miscellaneous Index Pages Design Spec

> Phase 5, Tier 2, Item 2.1
> Redesign the four miscellaneous listing pages (Variables, Functions, Type Aliases, Enumerations) with the same visual patterns as entity page index blocks.

## Decisions

| Decision | Choice | Rationale |
|-|-|-|
| Architecture | Separate page files, shared `IndexMisc` rewrite | Four kinds render different detail blocks (BlockMethod vs BlockProperty) |
| Layout | Flat alphabetical grid (no file grouping in index) | Grouped detail blocks below already provide file structure |
| Filter | Client-side, extracted from coverage module | 50+ items on misc pages, reuse existing debounced filter pattern |
| Indicators | Reuse BlockIndex letter indicator pattern | Same visual language across all listing/index UIs |
| Functional promotion | Deferred to Phase 6 (Architecture) | Requires data pipeline changes, not just UI |

## Index Grid

Replace `IndexMisc` (`src/templates/blocks/IndexMisc.tsx`) with the same pattern as `BlockIndex`:

```
.cdx-index                              <- border, radius, bg-alt (existing)
  .cdx-misc-filter                      <- filter input (above entries)
    input[data-cdx-misc-filter]
    button[data-cdx-misc-filter-clear]

  .cdx-index-entries                    <- multi-column grid (existing)
    .cdx-index-entry                    <- per item (existing)
      .cdx-index-indicator--{kind}      <- F/V/T/E colored letter
      .cdx-index-name                   <- entity name, links to #anchor
      (title=file path)                 <- tooltip shows source file
```

Items sorted alphabetically. No grouping in the index. Deprecated items get `line-through` + muted opacity (existing `.cdx-index-entry--deprecated`).

## Indicator Colors

Each miscellaneous kind gets a unique color. No duplicates with existing index indicators (P/M/I/O/A/C/H/L/S).

| Letter | Kind | Color | Token | Notes |
|-|-|-|-|-|
| F | Function | lime | `--color-cdx-entity-function` | #65a30d -- already exists |
| V | Variable | amber | `--color-cdx-entity-service` | #f59e0b -- not used by any index indicator |
| T | Type Alias | indigo | `--color-cdx-entity-typealias` | #6366f1 -- already exists |
| E | Enum | coral | `--color-cdx-entity-enum` | NEW: #f97316 (orange-500) |

New CSS variants in `content-sections.css`:
```css
.cdx-index-indicator--function  { background: var(--color-cdx-entity-function); }
.cdx-index-indicator--variable  { background: var(--color-cdx-entity-service); }
.cdx-index-indicator--typealias { background: var(--color-cdx-entity-typealias); }
.cdx-index-indicator--enum      { background: var(--color-cdx-entity-enum); }
```

New entity color token:
```css
--color-cdx-entity-enum: #f97316;  /* coral/orange — light */
/* dark: */ --color-cdx-entity-enum: #fb923c;
```

## Filter

Extract generic filter logic from `coverage.ts` into reusable pattern. The misc filter uses the same approach:

- `data-cdx-misc-filter` input attribute
- Debounced 150ms
- Filters `.cdx-index-entry` elements by `data-cdx-misc-name` attribute (case-insensitive substring)
- Escape key clears
- Clear button (x) appears when text entered
- No-results message when nothing matches

Add filter init to `initCoverage()` (rename to `initFilters()` or just add misc filter handling alongside coverage filter in the same module).

## Page Structure (per page)

```
breadcrumb: Miscellaneous > Variables

.cdx-index                              <- index grid with filter
  filter input
  flat alphabetical grid of all items
  (click scrolls to detail block below)

.cdx-content-section                    <- per file group (existing pattern)
  .cdx-section-heading                  <- file path as heading
  BlockProperty / BlockMethod           <- existing detail blocks (unchanged)
```

The detail blocks below the index stay as they are (grouped by file, rendered by BlockProperty/BlockMethod/etc). Only the index area at the top changes.

## Files to Change

| File | Change |
|-|-|
| `src/templates/blocks/IndexMisc.tsx` | Rewrite: use `.cdx-index` grid with indicators + filter |
| `src/styles/components/content-sections.css` | Add indicator variants (function/variable/typealias/enum) |
| `src/styles/compodocx.css` | Add `--color-cdx-entity-enum` token |
| `src/client/coverage.ts` | Add misc filter handler (same pattern) |
| `src/templates/pages/MiscellaneousVariables.tsx` | Pass `kind='variable'` to new IndexMisc |
| `src/templates/pages/MiscellaneousFunctions.tsx` | Pass `kind='function'` to new IndexMisc |
| `src/templates/pages/MiscellaneousTypealiases.tsx` | Pass `kind='typealias'` to new IndexMisc |
| `src/templates/pages/MiscellaneousEnumerations.tsx` | Pass `kind='enum'` to new IndexMisc |

## A11y Fixes (from UI/UX Pro Max validation)

### Touch target size
Index entries have only `padding: 3px 6px` -- below the 44px mobile minimum. Fix: increase padding on narrow viewports via container query:
```css
@container (max-width: 500px) {
  .cdx-index-entry { padding: 8px 10px; }
}
```

### Focus-visible state
Existing index entries have `:hover` but no `:focus-visible` ring. Fix: add to `content-sections.css`:
```css
.cdx-index-entry:focus-visible {
  outline: 2px solid var(--color-cdx-primary);
  outline-offset: 1px;
}
```

### Enum indicator contrast
White text on #f97316 has ~3.1:1 contrast -- below 4.5:1 minimum. Fix: use darker shade #c2410c (orange-700, ~5.4:1) for the enum indicator background.

Updated token:
```css
--color-cdx-entity-enum: #c2410c;  /* dark orange — passes WCAG AA */
/* dark: */ --color-cdx-entity-enum: #fb923c;
```

## What Does NOT Change

- Detail blocks below the index (BlockProperty, BlockMethod, etc.)
- File-based grouping of detail blocks
- Page routing / URL structure
- Data pipeline (functional promotion deferred to Phase 6)
- FunctionBadges rendering in MiscellaneousFunctions

## E2E Test Plan

Test against todomvc-ng2 fixture (port 4001):

1. Index grid visible on miscellaneous/variables page
2. Index uses `.cdx-index` container (not old `ul.index-list`)
3. Indicator letters match kind (V on variables, F on functions)
4. Indicators have unique colors (no two identical)
5. Indicator has `aria-hidden="true"`
6. Index entries are clickable anchor links (`href="#name"`)
7. Filter input visible with `aria-label`
8. Filter hides non-matching entries
9. Filter clear button works
10. Escape clears filter
11. No-results message shows for nonsense queries
12. Index entries show file path on hover (title attribute)
13. Deprecated entries have line-through style
14. No old `ul.index-list` remains on any misc page
15. Focus-visible ring on index entries (keyboard nav)
16. Touch targets >= 44px on narrow viewport
