import Html from '@kitajs/html';

type MemberCardProps = {
    readonly id: string;
    readonly deprecated?: boolean;
    readonly collapsible?: boolean;
    readonly header: string;
    readonly children: string;
};

/**
 * Thin wrapper for member card chrome.
 *
 * Renders `<article class="cdx-member-card">` with optional `<details>/<summary>`
 * for collapsible cards (methods, host listeners) and flat layout for the rest.
 *
 * When collapsible, permalink anchors inside `<summary>` get `tabindex="-1"`
 * to prevent keyboard focus conflicts with the summary toggle. Type-links
 * are converted to `<span>` since they'd be confusing inside a toggle control.
 */
export function MemberCard({
    id,
    deprecated,
    collapsible,
    header,
    children
}: MemberCardProps): string {
    const cardClass = deprecated
        ? 'cdx-member-card cdx-member-card--deprecated'
        : 'cdx-member-card';

    if (collapsible) {
        // Convert type-links to plain <span> inside summary (confusing as
        // interactive elements in a toggle control), but keep permalinks
        // in place with tabindex="-1" so they stay visually correct.
        const summaryHeader = header
            .replace(
                /(<a\b[^>]*class="cdx-member-permalink"[^>]*)(>)/g,
                '$1 tabindex="-1"$2'
            )
            .replace(
                /<a\b(?![^>]*class="cdx-member-permalink")[^>]*>(.*?)<\/a>/g,
                '<span>$1</span>'
            );

        return (
            <article class={cardClass} id={id}>
                <details open>
                    <summary>{summaryHeader}</summary>
                    <div class="cdx-member-body">{children}</div>
                </details>
            </article>
        ) as string;
    }

    return (
        <article class={cardClass} id={id}>
            {header}
            <div class="cdx-member-body">{children}</div>
        </article>
    ) as string;
}
