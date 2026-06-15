/**
 * Single source of truth for the StackBlitz playground manifest builder.
 * Both the dep walker and the file-content emitter read these limits — never
 * hardcode the same numbers in multiple call sites (caps belong at the
 * bottleneck so a future revision lifts them in one place).
 */

/** Maximum import depth to follow when walking transitive deps. */
export const STACKBLITZ_DEP_DEPTH = 3;

/** Hard ceiling on the number of source files included in one manifest. */
export const STACKBLITZ_FILE_COUNT_CAP = 25;

/** Per-file character cap applied at the file-content emitter bottleneck. */
export const STACKBLITZ_FILE_CAP = 8000;

/**
 * Total byte cap on a single playground's vendored (`playgroundVendor`)
 * closure. Vendoring inlines whole `dist/` trees (FESM bundles × secondary
 * entry points), so the per-file truncation cap does NOT apply to vendored
 * files — truncating a FESM bundle would corrupt it. Instead the closure is
 * measured up front and the build FAILS, naming the packages and sizes, when
 * it blows this cap. Generous by design: a typical UI-lib closure is well
 * under 1 MB; the ceiling exists to stop a runaway payload, not to trim.
 */
export const STACKBLITZ_VENDOR_TOTAL_CAP = 4_000_000;

/**
 * StackBlitz `template` value passed to `openProject`. We deliberately use
 * `'node'` (WebContainer-based) rather than `'angular-cli'`: the latter has
 * a pinned Angular version baked into StackBlitz's runtime, which conflicts
 * with the consumer's `@angular/core` spec and crashes the dev server. With
 * `'node'`, our `package.json` and `angular.json` drive everything fresh.
 */
export const STACKBLITZ_TEMPLATE = 'node' as const;

/** Footer appended to truncated file contents. */
export const STACKBLITZ_TRUNCATION_FOOTER =
    '\n// ... [truncated by compodocx, view full source on the doc page]';

/**
 * Tag pattern for the JSDoc parser. Title is required after the tag name;
 * an optional trailing `.html` / `.ts` relative path token switches the block
 * into file-ref mode (handled by `extractJsdocPlaygroundBlocks`). The actual
 * parsing lives in `src/templates/helpers/jsdoc.ts` — this regex stays as a
 * coarse documentation-grade matcher; downstream consumers should not rely on
 * its capture group for file-ref detection.
 */
export const PLAYGROUND_TAG_PATTERN = /^@playground\s+(.+?)$/m;
