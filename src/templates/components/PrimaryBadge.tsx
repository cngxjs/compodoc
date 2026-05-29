import Html from '@kitajs/html';
import { t } from '../helpers';

type PrimaryBadgeProps = {
    readonly docsKind?: 'primary' | string;
};

/**
 * Hero chip shown when an entity is the curated primary surface of its
 * bucket — either by being a `PRIMARY_KINDS` member or by an explicit
 * `@docsKind primary` promotion. Star icon + "Primary" label. Sits in the
 * entity-hero badge row between the type badge and the WCAG / Since chips.
 *
 * Returns `''` when `docsKind !== 'primary'` so callers can drop it in
 * unconditionally.
 */
export const PrimaryBadge = (props: PrimaryBadgeProps): string => {
    if (props.docsKind !== 'primary') {
        return '' as string;
    }
    return (
        <span
            class="cdx-badge cdx-badge--primary"
            title={t('docskind-primary-title')}
            data-cdx-docskind="primary"
        >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.39 7.36H22l-6.18 4.49 2.36 7.36L12 16.72l-6.18 4.49 2.36-7.36L2 9.36h7.61z" />
            </svg>
            Primary
        </span>
    ) as string;
};
