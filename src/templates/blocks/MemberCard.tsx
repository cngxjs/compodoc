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
 */
export function MemberCard({ id, deprecated, collapsible, header, children }: MemberCardProps): string {
    const cardClass = deprecated
        ? 'cdx-member-card cdx-member-card--deprecated'
        : 'cdx-member-card';

    if (collapsible) {
        return (
            <article class={cardClass} id={id}>
                <details open>
                    <summary>{header}</summary>
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
