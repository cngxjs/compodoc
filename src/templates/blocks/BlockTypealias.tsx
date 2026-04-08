import Html from '@kitajs/html';
import { functionSignature, linkTypeHtml, parseDescription, t } from '../helpers';
import { MemberCard } from './MemberCard';

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
        {props.typealias.map(ta => {
            const header = (
                <header class="cdx-member-header">
                    <span class="cdx-member-name">
                        <span class={ta.deprecated ? 'deprecated-name' : ''}>{ta.name}</span>
                        <a href={`#${ta.name}`} class="cdx-member-permalink" aria-label={`Link to ${ta.name}`}>#</a>
                    </span>
                </header>
            ) as string;

            const body = (<>
                {ta.deprecated && (
                    <div class="cdx-member-deprecated">{ta.deprecationMessage || t('deprecated')}</div>
                )}
                {ta.description && (
                    <div class="io-description">{parseDescription(ta.description, props.depth ?? 0)}</div>
                )}
                <div class="cdx-member-row">
                    {ta.kind === 160 ? (
                        <code>{functionSignature(ta)}</code>
                    ) : (
                        <code>{linkTypeHtml(ta.rawtype ?? '')}</code>
                    )}
                </div>
            </>) as string;

            return MemberCard({ id: ta.name, deprecated: ta.deprecated, header, children: body });
        })}
    </section>
) as string;
