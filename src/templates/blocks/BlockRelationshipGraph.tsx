import Html from '@kitajs/html';
import { linkTypeHtml, t } from '../helpers';
import { IconArrowLeft, IconArrowRight } from '../components/Icons';

type RelationshipNode = {
    readonly name: string;
    readonly type: string;
};

type BlockRelationshipGraphProps = {
    readonly incoming: RelationshipNode[];
    readonly outgoing: RelationshipNode[];
    readonly entityName: string;
};

const RelationshipList = (props: { items: RelationshipNode[]; title: string; iconHtml: string }): string => {
    if (!props.items?.length) return '';
    return (
        <div class="cdx-relationship-group">
            <h4>{props.iconHtml} {props.title}</h4>
            <ul class="cdx-relationship-list">
                {props.items.map(item => (
                    <li>
                        {linkTypeHtml(item.name)}
                        <span class="cdx-badge cdx-badge--entity-type">{item.type}</span>
                    </li>
                ))}
            </ul>
        </div>
    ) as string;
};

export const BlockRelationshipGraph = (props: BlockRelationshipGraphProps): string => {
    if (!props.incoming?.length && !props.outgoing?.length) return '';

    return (
        <section class="cdx-content-section" data-compodoc="block-relationships">
            <h3 class="cdx-section-heading">{t('relationships') || 'Relationships'}</h3>
            <div class="cdx-relationships">
                {RelationshipList({ items: props.incoming, title: 'Used by', iconHtml: IconArrowLeft() })}
                {RelationshipList({ items: props.outgoing, title: 'Depends on', iconHtml: IconArrowRight() })}
            </div>
        </section>
    ) as string;
};
