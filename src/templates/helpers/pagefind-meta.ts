import type { EntityKind } from '../../app/engines/dependencies.engine';

/**
 * User-facing labels for entity kinds. Surfaced on Pagefind search-result
 * chips so a search hit reads "ToastConfig — Interface — ui/feedback/toast"
 * instead of the legacy "Docs" placeholder. Kept in lockstep with the
 * sidebar's per-kind chip colours via `cdx-badge--entity-<kind>` tokens.
 */
export const KIND_LABELS: Record<EntityKind, string> = {
    component: 'Component',
    directive: 'Directive',
    pipe: 'Pipe',
    injectable: 'Injectable',
    class: 'Class',
    interface: 'Interface',
    guard: 'Guard',
    interceptor: 'Interceptor',
    entity: 'Entity',
    function: 'Function',
    variable: 'Variable',
    typealias: 'Type Alias',
    enumeration: 'Enumeration'
};

/**
 * Strip HTML tags from a rendered description and return the first
 * sentence, truncated to ~120 chars for use as a Pagefind search excerpt.
 * Source is the entity's already-rendered `description` HTML (markdown →
 * marked → HTML); we re-strip rather than re-render to avoid markdown
 * residue like backticks or asterisks bleeding into the search index.
 *
 * Returns `undefined` when the input is empty or strips to whitespace —
 * callers omit the meta block entirely in that case so the Pagefind index
 * stays small.
 */
export function firstSentence(html: unknown): string | undefined {
    if (typeof html !== 'string' || html.length === 0) {
        return undefined;
    }
    // Drop tags first, then collapse whitespace runs (markdown line breaks
    // leave `<br/>` followed by whitespace; both vanish here).
    const stripped = html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!stripped) {
        return undefined;
    }
    // First sentence — split on `.`, `!`, `?` followed by whitespace OR
    // anchored at end-of-string. Fallback: the entire stripped string when
    // no sentence terminator exists (single-clause descriptions are common).
    // Trim trailing sentence terminators so the excerpt reads naturally.
    const split = stripped.split(/[.!?](?:\s|$)/)[0] ?? stripped;
    const sentence = split.replace(/[.!?]+$/, '').trim();
    const value = sentence || stripped;
    if (value.length <= 120) {
        return value;
    }
    return `${value.slice(0, 117)}...`;
}

/**
 * Inputs for the Pagefind meta block.
 *
 * Pagefind reads metadata from elements carrying a `data-pagefind-meta`
 * attribute — either in `key:value` literal form or in inner-text form
 * (`data-pagefind-meta="key"` with text content as the value). The
 * `data-pagefind-meta-X="..."` per-key attribute form looks plausible but
 * is NOT discovered by Pagefind's static scan, so an earlier iteration of
 * this helper silently produced no meta keys at all. See
 * <https://pagefind.app/docs/metadata/> for the supported syntax.
 */
export interface PagefindMetaInput {
    readonly kind?: EntityKind;
    readonly category?: string;
    readonly description?: string;
}

/**
 * Render a Pagefind-discoverable meta block as a string fragment of hidden
 * spans. Each span carries one `data-pagefind-meta` attribute:
 *
 *   - `kind` and `category` use the literal `key:value` form (short, safe
 *     values, no commas or colons in real-world content).
 *   - `description` uses the inner-text form so values containing commas,
 *     colons, or quotes survive without escaping the `data-pagefind-meta`
 *     attribute parser.
 *
 * Empty / whitespace-only fields are omitted entirely — Pagefind index
 * stays small. The block is rendered inside the entity hero and hidden
 * with the `hidden` attribute (Pagefind's static HTML scan still picks it
 * up; the browser does not render it).
 */
export function pagefindMetaBlock(input: PagefindMetaInput): string {
    const parts: string[] = [];
    if (input.kind && KIND_LABELS[input.kind]) {
        const label = escapeAttr(KIND_LABELS[input.kind]);
        parts.push(`<span hidden data-pagefind-meta="kind:${label}"></span>`);
    }
    if (typeof input.category === 'string') {
        const trimmed = input.category.trim();
        if (trimmed) {
            const value = escapeAttr(trimmed);
            parts.push(`<span hidden data-pagefind-meta="category:${value}"></span>`);
        }
    }
    const excerpt = firstSentence(input.description);
    if (excerpt) {
        const text = escapeText(excerpt);
        parts.push(`<span hidden data-pagefind-meta="description">${text}</span>`);
    }
    return parts.join('');
}

function escapeAttr(value: string): string {
    return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function escapeText(value: string): string {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/**
 * Inputs for the Pagefind filter block. Filter attributes are distinct
 * from meta attributes: meta shows up in result rendering, filters power
 * the facet UI. Filters use the multi-attribute form
 * (`data-pagefind-filter-<dimension>="value"`) so dimensions stay
 * independent — Pagefind 1.0+ surfaces each suffix as its own facet
 * dimension via `pagefind.filters()`.
 *
 * The single-value `data-pagefind-filter="kind:Component"` form is also
 * supported by Pagefind for the legacy "kind" dimension; we emit both so
 * pre-1.0 indexes and future versions stay compatible.
 */
export interface PagefindFilterInput {
    readonly kind?: EntityKind | 'Bucket' | 'Module';
    readonly lib?: string;
    readonly bucket?: string;
    /** `primary` for promoted symbols, `reference` for everything else. */
    readonly docsKind?: 'primary' | 'reference';
    readonly wcag?: 'A' | 'AA' | 'AAA';
}

/** Map an EntityKind to its facet-UI label. Non-entity rows (Bucket,
 *  Module) are passed through verbatim. */
function kindFilterLabel(kind: EntityKind | 'Bucket' | 'Module' | undefined): string | undefined {
    if (!kind) {
        return undefined;
    }
    if (kind === 'Bucket' || kind === 'Module') {
        return kind;
    }
    return KIND_LABELS[kind];
}

/**
 * Render Pagefind filter spans for an entity hero. Empty fields are
 * omitted so the index does not carry phantom facet values. The block is
 * hidden visually (`hidden` attribute) but stays in the static HTML so
 * Pagefind's build-time scan picks it up.
 *
 * Pagefind's filter discovery is attribute-driven, NOT element-content
 * driven — putting filter values inside `<span>` text would NOT register.
 * Always use the `data-pagefind-filter-<dim>="<value>"` attribute form.
 */
export function pagefindFilterBlock(input: PagefindFilterInput): string {
    const attrs: string[] = [];
    const kindLabel = kindFilterLabel(input.kind);
    if (kindLabel) {
        attrs.push(`data-pagefind-filter="kind:${escapeAttr(kindLabel)}"`);
        attrs.push(`data-pagefind-filter-kind="${escapeAttr(kindLabel)}"`);
    }
    if (input.lib?.trim()) {
        attrs.push(`data-pagefind-filter-lib="${escapeAttr(input.lib.trim())}"`);
    }
    if (input.bucket?.trim()) {
        attrs.push(`data-pagefind-filter-bucket="${escapeAttr(input.bucket.trim())}"`);
    }
    if (input.docsKind) {
        attrs.push(`data-pagefind-filter-tier="${escapeAttr(input.docsKind)}"`);
    }
    if (input.wcag) {
        attrs.push(`data-pagefind-filter-wcag="${escapeAttr(input.wcag)}"`);
    }
    if (attrs.length === 0) {
        return '';
    }
    return `<span hidden ${attrs.join(' ')}></span>`;
}

/**
 * Derive the "library" facet value from a bucket id (e.g.
 * `ui/feedback/toast` → `ui`). When the bucket id is empty, fall back to
 * the leading segment of the source-file path so single-app workspaces
 * still surface their top-level folders as facet values.
 */
export function deriveLibFromBucket(bucketOrFile: string | undefined): string | undefined {
    if (!bucketOrFile) {
        return undefined;
    }
    const normalised = bucketOrFile.replaceAll('\\', '/').trim();
    if (!normalised) {
        return undefined;
    }
    const first = normalised.split('/').filter(Boolean)[0];
    return first || undefined;
}
