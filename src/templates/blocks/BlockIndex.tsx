import Html from '@kitajs/html';
import { modifKind, t } from '../helpers';

type IndexItem = {
    readonly name: string;
    readonly deprecated?: boolean;
    readonly optional?: boolean;
    readonly modifierKind?: number[];
};

type BlockIndexProps = {
    readonly properties?: IndexItem[];
    readonly methods?: IndexItem[];
    readonly inputs?: IndexItem[];
    readonly outputs?: IndexItem[];
    readonly hostBindings?: IndexItem[];
    readonly hostListeners?: IndexItem[];
    readonly accessors?: Record<string, any>;
};

const IndexGroup = (props: { title: string; items: IndexItem[]; showModifiers?: boolean }): string => {
    if (!props.items?.length) return '';
    return (<>
        <h6><b>{t(props.title)}</b></h6>
        <ul class="index-list">
            {props.items.map(item => (
                <li>
                    {props.showModifiers && (item.modifierKind ?? []).map((k: number) => (
                        <span class="modifier">{modifKind(k)}</span>
                    ))}
                    {props.showModifiers && item.optional && (
                        <span class="modifier">{t('optional')}</span>
                    )}
                    <a href={`#${item.name}`} class={item.deprecated ? 'deprecated-name' : ''}>{item.name}</a>
                </li>
            ))}
        </ul>
    </>) as string;
};

export const BlockIndex = (props: BlockIndexProps): string => {
    const accessorEntries = props.accessors ? Object.entries(props.accessors) : [];

    const hasContent = (props.properties?.length ?? 0) > 0
        || (props.methods?.length ?? 0) > 0
        || (props.inputs?.length ?? 0) > 0
        || (props.outputs?.length ?? 0) > 0
        || (props.hostBindings?.length ?? 0) > 0
        || (props.hostListeners?.length ?? 0) > 0
        || accessorEntries.length > 0;

    if (!hasContent) return '';

    return (
        <section data-compodoc="block-index">
            <h3 id="index">{t('index')}</h3>
            <article class="cdx-member-card">
                <div class="cdx-member-body">
                    {IndexGroup({ title: 'properties', items: props.properties ?? [], showModifiers: true })}
                    {IndexGroup({ title: 'methods', items: props.methods ?? [], showModifiers: true })}
                    {IndexGroup({ title: 'inputs', items: props.inputs ?? [] })}
                    {IndexGroup({ title: 'outputs', items: props.outputs ?? [] })}
                    {IndexGroup({ title: 'hostbindings', items: props.hostBindings ?? [] })}
                    {IndexGroup({ title: 'hostlisteners', items: props.hostListeners ?? [] })}
                    {accessorEntries.length > 0 && (<>
                        <h6><b>{t('accessors')}</b></h6>
                        <ul class="index-list">
                            {accessorEntries.map(([key, acc]) => (
                                <li>
                                    {(acc.modifierKind ?? []).map((k: number) => (
                                        <span class="modifier">{modifKind(k)}</span>
                                    ))}
                                    <a href={`#${key}`} class={acc.deprecated ? 'deprecated-name' : ''}>{key}</a>
                                </li>
                            ))}
                        </ul>
                    </>)}
                </div>
            </article>
        </section>
    ) as string;
};
