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
 * When collapsible, permalink anchors are moved out of `<summary>` to avoid
 * an a11y violation (interactive elements inside `<summary>` are not
 * consistently accessible via keyboard/assistive technology).
 */
export function MemberCard({ id, deprecated, collapsible, header, children }: MemberCardProps): string {
    const cardClass = deprecated
        ? 'cdx-member-card cdx-member-card--deprecated'
        : 'cdx-member-card';

    if (collapsible) {
        // Strip all <a> tags from header for the summary (a11y: no interactive
        // elements inside <summary>). Permalinks are moved as siblings;
        // type-links are converted to plain <span> keeping their content.
        const permalinkRe = /<a\b[^>]*class="cdx-member-permalink"[^>]*>.*?<\/a>/g;
        const permalink = header.match(permalinkRe)?.[0] ?? '';
        const summaryHeader = header
            .replace(permalinkRe, '')
            .replace(/<a\b[^>]*>(.*?)<\/a>/g, '<span>$1</span>');

        return (
            <article class={cardClass} id={id}>
                <details open>
                    <summary>{summaryHeader}</summary>
                    {permalink}
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
