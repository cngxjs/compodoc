import Html from '@kitajs/html';
import { extractJsdocParams, linkTypeHtml, oneParameterHas, parseDescription, t } from '../helpers';
import type { JsdocTag } from '../helpers/jsdoc';

type ParamsTableProps = {
    readonly jsdocTags: any[];
    readonly depth: number;
    readonly showOptional?: boolean;
    readonly showDefaultValue?: boolean;
};

/** Render a JSDoc @param table. Used by block-method, block-constructor, block-accessors etc. */
export const ParamsTable = (props: ParamsTableProps): string => {
    const tags = extractJsdocParams(props.jsdocTags);
    if (tags.length === 0) return '';

    const hasType = oneParameterHas(tags, 'type');
    const hasComment = oneParameterHas(tags, 'comment');
    const hasDefault = props.showDefaultValue !== false && oneParameterHas(tags, 'defaultValue');

    return (<>
        <b>{t('parameters')} :</b>
        <table class="params">
            <thead>
                <tr>
                    <td>{t('name')}</td>
                    {hasType && <td>{t('type')}</td>}
                    {props.showOptional !== false && <td>{t('optional')}</td>}
                    {hasDefault && <td>{t('default-value')}</td>}
                    {hasComment && <td>{t('description')}</td>}
                </tr>
            </thead>
            <tbody>
                {tags.map(tag => (
                    <tr>
                        {tag.name && <td>{tag.name}</td>}
                        {hasType && <td>{tag.type ? linkTypeHtml(tag.type) : ''}</td>}
                        {props.showOptional !== false && (
                            <td>{tag.optional ? t('yes') : t('no')}</td>
                        )}
                        {hasDefault && (
                            <td>{tag.defaultValue ? <code>{tag.defaultValue}</code> : ''}</td>
                        )}
                        {hasComment && (
                            <td>{tag.comment ? parseDescription(tag.comment, props.depth) : ''}</td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    </>) as string;
};
