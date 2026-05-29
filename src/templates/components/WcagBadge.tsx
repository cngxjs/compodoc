import Html from '@kitajs/html';
import { t } from '../helpers';

type WcagBadgeProps = {
    readonly wcagLevel?: 'A' | 'AA' | 'AAA' | string;
};

/**
 * Colored chip on entity heroes showing the WCAG conformance level the
 * symbol claims. A = grey (basic), AA = green (recommended target),
 * AAA = blue (enhanced). Title attribute carries the localised label so
 * screen readers announce "WCAG AA conformance" rather than just "AA".
 */
export const WcagBadge = (props: WcagBadgeProps): string => {
    const level = props.wcagLevel;
    if (level !== 'A' && level !== 'AA' && level !== 'AAA') {
        return '' as string;
    }
    const lowered = level.toLowerCase();
    const tooltip = `${t('wcag-level')} ${level}`;
    return (
        <span
            class={`cdx-badge cdx-badge--wcag cdx-badge--wcag-${lowered}`}
            title={tooltip}
            data-cdx-wcag={level}
        >
            {`WCAG ${level}`}
        </span>
    ) as string;
};
