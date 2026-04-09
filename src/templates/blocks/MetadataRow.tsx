import Html from '@kitajs/html';
import { t } from '../helpers';

/** Single metadata row: `<dt>label</dt><dd>value</dd>` inside a `cdx-metadata-row`. */
export function MetadataRow(label: string, value: string, isBlock = false): string {
    return (
        <div class={`cdx-metadata-row${isBlock ? ' cdx-metadata-row--block' : ''}`}>
            <dt class="cdx-metadata-label">{label}</dt>
            <dd class="cdx-metadata-value">{value}</dd>
        </div>
    ) as string;
}

/** Metadata row with value wrapped in `<code>`. */
export function MetadataCodeRow(label: string, value: string): string {
    return MetadataRow(label, `<code>${value}</code>`);
}

/** Full metadata section: `<section>` + `<h3>` + `<dl>` wrapping pre-rendered rows. */
export function MetadataSection(props: {
    readonly title?: string;
    readonly rows: string[];
}): string {
    if (props.rows.length === 0) {
        return '';
    }
    return (
        <section class="cdx-content-section" data-compodoc="block-metadata">
            <h3 class="cdx-section-heading">{props.title ?? t('metadata')}</h3>
            <dl class="cdx-metadata-card">{props.rows.join('')}</dl>
        </section>
    ) as string;
}
