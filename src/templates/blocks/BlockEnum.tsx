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
            <article class={`cdx-member-card${e.deprecated ? ' cdx-member-card--deprecated' : ''}`} id={e.name}>
                <header class="cdx-member-header">
                    <span class="cdx-member-name">
                        <span class={e.deprecated ? 'deprecated-name' : ''}>{e.name}</span>
                        <a href={`#${e.name}`} aria-label={`Link to ${e.name}`}>#</a>
                    </span>
                </header>
                <div class="cdx-member-body">
                    {e.deprecated && (
                        <div class="cdx-member-deprecated">{e.deprecationMessage}</div>
                    )}
                    {e.description && (
                        <div class="io-description">{parseDescription(e.description, props.depth ?? 0)}</div>
                    )}
                    {(e.childs ?? []).map(child => (<>
                        {child.name && <div class="cdx-member-row">{child.name}</div>}
                        {child.value && <div class="cdx-member-row"><i>{t('value')} : </i><code>{child.value}</code></div>}
                    </>))}
                </div>
            </article>
        ))}
    </section>
) as string;
