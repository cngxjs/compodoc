import Html from '@kitajs/html';
import { linkTypeHtml, t } from '../helpers';

type RelationshipNode = {
    readonly name: string;
    readonly type: string;
};

type BlockRelationshipGraphProps = {
    readonly incoming: RelationshipNode[];
    readonly outgoing: RelationshipNode[];
    readonly entityName: string;
};

const RelationshipList = (props: { items: RelationshipNode[]; title: string; icon: string }): string => {
    if (!props.items?.length) return '';
    return (
        <div class="cdx-relationship-group">
            <h4><span class={`icon ${props.icon}`}></span> {props.title}</h4>
            <ul class="cdx-relationship-list">
                {props.items.map(item => (
                    <li>
                        {linkTypeHtml(item.name)}
                        <span class="cdx-badge cdx-badge--since">{item.type}</span>
                    </li>
                ))}
            </ul>
        </div>
    ) as string;
};

export const BlockRelationshipGraph = (props: BlockRelationshipGraphProps): string => {
    if (!props.incoming?.length && !props.outgoing?.length) return '';

    return (
        <section data-compodoc="block-relationships">
            <h3>{t('relationships') || 'Relationships'}</h3>
            <div class="cdx-relationships">
                {RelationshipList({ items: props.incoming, title: 'Used by', icon: 'ion-ios-arrow-back' })}
                {RelationshipList({ items: props.outgoing, title: 'Depends on', icon: 'ion-ios-arrow-forward' })}
            </div>
        </section>
    ) as string;
};
