import Html from '@kitajs/html';
import { isTabEnabled, linkTypeHtml, t } from '../helpers';

type DefinedInRowProps = {
    readonly line?: number;
    readonly file: string;
    readonly inheritance?: { readonly file: string };
    readonly navTabs?: any[];
};

/** Render "Inherited from" + "Defined in" rows for a block item. */
export const DefinedInRow = (props: DefinedInRowProps): string => {
    if (!props.line || !isTabEnabled(props.navTabs, 'source')) return '';

    return (<>
        {props.inheritance && (
            <tr>
                <td class="col-md-4">
                    <div class="io-line">{t('inherited-from')} {linkTypeHtml(props.inheritance.file)}</div>
                </td>
            </tr>
        )}
        <tr>
            <td class="col-md-4">
                {props.inheritance ? (
                    <div class="io-line">{t('defined-in')} {linkTypeHtml(props.inheritance.file, { withLine: true, line: props.line })}</div>
                ) : (
                    <div class="io-line">{t('defined-in')} <a href="" data-line={String(props.line)} class="link-to-prism">{props.file}:{props.line}</a></div>
                )}
            </td>
        </tr>
    </>) as string;
};
