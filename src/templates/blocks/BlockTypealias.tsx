import Html from '@kitajs/html';
import { functionSignature, linkTypeHtml, modifIconFromArray, parseDescription } from '../helpers';

type TypealiasItem = {
    readonly name: string;
    readonly kind?: number;
    readonly deprecated?: boolean;
    readonly deprecationMessage?: string;
    readonly description?: string;
    readonly modifierKind?: number[];
    readonly rawtype?: string;
    readonly args?: any[];
    [key: string]: unknown;
};

type BlockTypealiasProps = {
    readonly typealias: TypealiasItem[];
    readonly depth?: number;
};

export const BlockTypealias = (props: BlockTypealiasProps): string => (
    <section data-compodoc="block-typealias">
        {props.typealias.map(ta => (
            <table class="table table-sm table-bordered">
                <tbody>
                    <tr>
                        <td class="col-md-4">
                            <span id={ta.name}></span>
                            <span class={`name${ta.deprecated ? ' deprecated-name' : ''}`}><b>{ta.name}</b><a href={`#${ta.name}`}><span class="icon ion-ios-link"></span></a></span>
                        </td>
                    </tr>
                    {ta.deprecated && (
                        <tr><td class="col-md-4 deprecated">{ta.deprecationMessage}</td></tr>
                    )}
                    {ta.description && (
                        <tr><td class="col-md-4"><div class="io-description">{parseDescription(ta.description, props.depth ?? 0)}</div></td></tr>
                    )}
                    {ta.kind === 160 ? (
                        <tr><td class="col-md-4"><code>{functionSignature(ta)}</code></td></tr>
                    ) : (
                        <tr>
                            <td class="col-md-4">
                                {ta.modifierKind && <span class={`modifier-icon icon ion-ios-${modifIconFromArray(ta.modifierKind)}`}></span>}
                                <code>{linkTypeHtml(ta.rawtype ?? '')}</code>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        ))}
    </section>
) as string;
