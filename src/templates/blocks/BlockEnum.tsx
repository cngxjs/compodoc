import Html from '@kitajs/html';
import { parseDescription, t } from '../helpers';

type EnumChild = { readonly name?: string; readonly value?: string };
type EnumItem = {
    readonly name: string;
    readonly deprecated?: boolean;
    readonly deprecationMessage?: string;
    readonly description?: string;
    readonly childs?: EnumChild[];
};

type BlockEnumProps = {
    readonly enums: EnumItem[];
    readonly depth?: number;
};

export const BlockEnum = (props: BlockEnumProps): string => (
    <section data-compodoc="block-enums">
        {props.enums.map(e => (
            <table class="table table-sm table-bordered">
                <tbody>
                    <tr>
                        <td class="col-md-4">
                            <span id={e.name}></span>
                            <span class={`name${e.deprecated ? ' deprecated-name' : ''}`}><b>{e.name}</b><a href={`#${e.name}`}><span class="icon ion-ios-link"></span></a></span>
                        </td>
                    </tr>
                    {e.deprecated && (
                        <tr><td class="col-md-4 deprecated">{e.deprecationMessage}</td></tr>
                    )}
                    {e.description && (
                        <tr><td class="col-md-4"><div class="io-description">{parseDescription(e.description, props.depth ?? 0)}</div></td></tr>
                    )}
                    {(e.childs ?? []).map(child => (<>
                        {child.name && <tr><td class="col-md-4">&nbsp;{child.name}</td></tr>}
                        {child.value && <tr><td class="col-md-4"><i>{t('value')} : </i><code>{child.value}</code></td></tr>}
                    </>))}
                </tbody>
            </table>
        ))}
    </section>
) as string;
