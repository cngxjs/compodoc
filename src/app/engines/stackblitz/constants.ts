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

/** StackBlitz `template` value passed to `openProject`. */
export const STACKBLITZ_TEMPLATE = 'angular-cli' as const;

/** Footer appended to truncated file contents. */
export const STACKBLITZ_TRUNCATION_FOOTER =
    '\n// ... [truncated by compodocx, view full source on the doc page]';

/** Tag pattern for the JSDoc parser. Title is required after the tag name. */
export const PLAYGROUND_TAG_PATTERN = /^@playground\s+(.+?)$/m;
