import Html from '@kitajs/html';
import { linkTypeHtml, parseDescription, t } from '../helpers';
import { DefinedInRow } from './DefinedInRow';

type BlockInputProps = {
    readonly element: any;
    readonly file: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockInput = (props: BlockInputProps): string => (
    <section data-compodoc="block-inputs">
        <h3 id="inputs">{t('inputs')}</h3>
        {(props.element.inputsClass ?? []).map((inp: any) => (
            <table class="table table-sm table-bordered">
                <tbody>
                    <tr>
                        <td class="col-md-4">
                            <span id={inp.name}></span>
                            <b>{inp.name}</b>
                            {inp.signalKind && <span class={`cdx-badge cdx-badge--${inp.signalKind}`}>{inp.signalKind === 'input-signal' ? 'Signal' : inp.signalKind === 'model' ? 'Model' : ''}</span>}
                            {inp.required && <span class="cdx-badge cdx-badge--factory">Required</span>}
                        </td>
                    </tr>
                    {inp.type && (
                        <tr><td class="col-md-4"><i>{t('type')} : </i>{linkTypeHtml(inp.type)}</td></tr>
                    )}
                    {inp.required && (
                        <tr><td class="col-md-4"><i>{t('required')} : </i>&nbsp;<b>{String(inp.required)}</b></td></tr>
                    )}
                    {inp.defaultValue && (
                        <tr><td class="col-md-4"><i>{t('default-value')} : </i><code>{inp.defaultValue}</code></td></tr>
                    )}
                    {DefinedInRow({ line: inp.line, file: props.element.file, inheritance: inp.inheritance, navTabs: props.navTabs })}
                    {inp.description && (
                        <tr><td class="col-md-4"><div class="io-description">{parseDescription(inp.description, props.depth ?? 0)}</div></td></tr>
                    )}
                </tbody>
            </table>
        ))}
    </section>
) as string;
