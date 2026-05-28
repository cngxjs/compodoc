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
 * callers omit the meta attribute entirely in that case so the Pagefind
 * index stays small.
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
 * Build the `data-pagefind-meta-*` attribute string for an entity hero.
 * Pagefind reads these during indexing and surfaces them on search-result
 * data. Empty fields are omitted entirely to keep the index small.
 *
 * The category falls back to the bucket path under `menuLayout: 'feature'`;
 * caller resolves which value to pass (raw `@category` string or the
 * folder-derived bucket key).
 */
export interface PagefindMetaInput {
    readonly kind?: EntityKind;
    readonly category?: string;
    readonly description?: string;
}

export interface PagefindMetaAttrs {
    readonly 'data-pagefind-meta-kind'?: string;
    readonly 'data-pagefind-meta-category'?: string;
    readonly 'data-pagefind-meta-description'?: string;
}

export function pagefindMetaAttrs(input: PagefindMetaInput): PagefindMetaAttrs {
    const attrs: Record<string, string> = {};
    if (input.kind && KIND_LABELS[input.kind]) {
        attrs['data-pagefind-meta-kind'] = KIND_LABELS[input.kind];
    }
    if (typeof input.category === 'string') {
        const trimmed = input.category.trim();
        if (trimmed) {
            attrs['data-pagefind-meta-category'] = trimmed;
        }
    }
    const excerpt = firstSentence(input.description);
    if (excerpt) {
        attrs['data-pagefind-meta-description'] = excerpt;
    }
    return attrs as PagefindMetaAttrs;
}
