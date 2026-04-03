import Html from '@kitajs/html';
import { extractJsdocParams, linkTypeHtml, oneParameterHas, parseDescription, t } from '../helpers';
import type { JsdocTag } from '../helpers/jsdoc';

type ParamsTableProps = {
    readonly jsdocTags: any[];
    readonly depth: number;
    readonly showOptional?: boolean;
    readonly showDefaultValue?: boolean;
};

/** Render a JSDoc @param list. */
export const ParamsTable = (props: ParamsTableProps): string => {
    const tags = extractJsdocParams(props.jsdocTags);
    if (tags.length === 0) return '';

    const hasType = oneParameterHas(tags, 'type');
    const hasComment = oneParameterHas(tags, 'comment');
    const hasDefault = props.showDefaultValue !== false && oneParameterHas(tags, 'defaultValue');

    return (<>
        <b>{t('parameters')} :</b>
        <div class="cdx-params">
            <div class="cdx-params-header">
                <span class="cdx-params-name">{t('name')}</span>
                {hasType && <span class="cdx-params-type">{t('type')}</span>}
                {props.showOptional !== false && <span class="cdx-params-opt">{t('optional')}</span>}
                {hasDefault && <span class="cdx-params-opt">{t('default-value')}</span>}
                {hasComment && <span class="cdx-params-desc">{t('description')}</span>}
            </div>
            {tags.map(tag => (
                <div class="cdx-params-row">
                    {tag.name && <span class="cdx-params-name">{tag.name}</span>}
                    {hasType && <span class="cdx-params-type">{tag.type ? linkTypeHtml(tag.type) : ''}</span>}
                    {props.showOptional !== false && (
                        <span class="cdx-params-opt">{tag.optional ? t('yes') : t('no')}</span>
                    )}
                    {hasDefault && (
                        <span class="cdx-params-opt">{tag.defaultValue ? <code>{tag.defaultValue}</code> : ''}</span>
                    )}
                    {hasComment && (
                        <span class="cdx-params-desc">{tag.comment ? parseDescription(tag.comment, props.depth) : ''}</span>
                    )}
                </div>
            ))}
        </div>
    </>) as string;
};
