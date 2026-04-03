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
            <article class={`cdx-member-card${ta.deprecated ? ' cdx-member-card--deprecated' : ''}`} id={ta.name}>
                <header class="cdx-member-header">
                    <span class="cdx-member-name">
                        <span class={ta.deprecated ? 'deprecated-name' : ''}>{ta.name}</span>
                        <a href={`#${ta.name}`} aria-label={`Link to ${ta.name}`}>#</a>
                    </span>
                </header>
                <div class="cdx-member-body">
                    {ta.deprecated && (
                        <div class="cdx-member-deprecated">{ta.deprecationMessage}</div>
                    )}
                    {ta.description && (
                        <div class="io-description">{parseDescription(ta.description, props.depth ?? 0)}</div>
                    )}
                    <div class="cdx-member-row">
                        {ta.kind === 160 ? (
                            <code>{functionSignature(ta)}</code>
                        ) : (<>
                            <code>{linkTypeHtml(ta.rawtype ?? '')}</code>
                        </>)}
                    </div>
                </div>
            </article>
        ))}
    </section>
) as string;
