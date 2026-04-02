import Html from '@kitajs/html';
import { linkTypeHtml, parseDescription, t } from '../helpers';
import { DefinedInRow } from './DefinedInRow';

type BlockOutputProps = {
    readonly element: any;
    readonly file: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockOutput = (props: BlockOutputProps): string => (
    <section data-compodoc="block-outputs">
        <h3 id="outputs">{t('outputs')}</h3>
        {(props.element.outputsClass ?? []).map((out: any) => (
            <table class="table table-sm table-bordered">
                <tbody>
                    <tr>
                        <td class="col-md-4">
                            <span id={out.name}></span>
                            <b>{out.name}</b>
                        </td>
                    </tr>
                    {out.type && (
                        <tr><td class="col-md-4"><i>{t('type')} : </i>{linkTypeHtml(out.type)}</td></tr>
                    )}
                    {DefinedInRow({ line: out.line, file: props.element.file, inheritance: out.inheritance, navTabs: props.navTabs })}
                    {out.description && (
                        <tr><td class="col-md-4"><div class="io-description">{parseDescription(out.description, props.depth ?? 0)}</div></td></tr>
                    )}
                </tbody>
            </table>
        ))}
    </section>
) as string;
