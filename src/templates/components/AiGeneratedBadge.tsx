import Html from '@kitajs/html';
import { t } from '../helpers';

type AiGeneratedBadgeProps = {
    readonly aiGenerated?: string | true | false;
};

/**
 * Small chip shown on entity heroes and markdown pages whose source is
 * tagged with `@aiGenerated` (JSDoc) or `<!-- @aiGenerated -->`
 * (markdown). Optional tag value (model name, date, …) lands in the
 * `title` attribute.
 */
export const AiGeneratedBadge = (props: AiGeneratedBadgeProps): string => {
    if (!props.aiGenerated) {
        return '' as string;
    }
    const detail = typeof props.aiGenerated === 'string' ? props.aiGenerated : '';
    const tooltip = detail ? `${t('ai-generated-tooltip')} — ${detail}` : t('ai-generated-tooltip');
    return (
        <span class="cdx-badge cdx-badge--ai-generated" title={tooltip}>
            {t('ai-generated')}
        </span>
    ) as string;
};
