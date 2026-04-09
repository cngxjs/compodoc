import Html from '@kitajs/html';
import { extractJsdocCodeExamples, extractJsdocExamples, t } from '../helpers';

type JsdocExamplesBlockProps = {
    readonly tags: any[];
    readonly variant?: 'code' | 'text';
    readonly cssClass?: string;
    readonly level?: 'section' | 'inline';
};

/**
 * Shared JSDoc example renderer.
 *
 * - `variant: 'code'` (default) uses `extractJsdocCodeExamples` (fenced code blocks -> <pre><code>)
 * - `variant: 'text'` uses `extractJsdocExamples` (simple caption replacement)
 * - `level: 'section'` wraps in `<section>` with `<h3>` (EntityPage style)
 * - `level: 'inline'` (default) renders bare content
 */
export function JsdocExamplesBlock({ tags, variant = 'code', cssClass, level = 'inline' }: JsdocExamplesBlockProps): string {
    const examples = variant === 'code'
        ? extractJsdocCodeExamples(tags)
        : extractJsdocExamples(tags);

    if (examples.length === 0) return '';

    const items = examples.map(ex =>
        (<div class={cssClass}>{ex.comment}</div>) as string
    ).join('');

    if (level === 'section') {
        return (
            <section class="cdx-content-section">
                <h3 class="cdx-section-heading">{t('example')}</h3>
                <div class="cdx-member-description">{items}</div>
            </section>
        ) as string;
    }

    return (<>
        <b>{t('example')} :</b>
        {items}
    </>) as string;
}
