import Html from '@kitajs/html';
import {
    IconClass,
    IconComponent,
    IconDirective,
    IconEntity,
    IconExternalLink,
    IconGuard,
    IconInjectable,
    IconInterceptor,
    IconInterface,
    IconModule,
    IconPipe
} from '../components/Icons';
import { resolveType } from '../helpers/link-type';
import { t } from '../helpers';

type RelationshipNode = {
    readonly name: string;
    readonly type: string;
    readonly description?: string;
    readonly subtype?: string;
};

type BlockRelationshipGraphProps = {
    readonly incoming: RelationshipNode[];
    readonly outgoing: RelationshipNode[];
    readonly entityName: string;
};

/** Normalise the compodoc entity type to the CSS token used by --color-cdx-entity-*. */
const normaliseType = (type: string): string => {
    const t = (type || '').toLowerCase();
    if (t === 'injectable' || t === 'service') {
        return 'service';
    }
    if (t.endsWith('s')) {
        return t.slice(0, -1);
    }
    return t;
};

/** Map an entity type to its Lucide-ish icon. */
const iconFor = (type: string): string => {
    switch (normaliseType(type)) {
        case 'component':
            return IconComponent();
        case 'directive':
            return IconDirective();
        case 'pipe':
            return IconPipe();
        case 'module':
            return IconModule();
        case 'class':
            return IconClass();
        case 'interface':
            return IconInterface();
        case 'guard':
            return IconGuard();
        case 'interceptor':
            return IconInterceptor();
        case 'service':
            return IconInjectable();
        case 'entity':
            return IconEntity();
        default:
            return IconClass();
    }
};

/** Resolve an entity name to its generated docs URL, falling back to '#'. */
const linkFor = (name: string): { href: string; target: string } => {
    const resolved = resolveType(name);
    if (resolved) {
        return { href: resolved.href, target: resolved.target };
    }
    return { href: '#', target: '_self' };
};

/** Card rendered under the "Used By" column — tall, description-friendly. */
const IncomingCard = (node: RelationshipNode): string => {
    const kind = normaliseType(node.type);
    const link = linkFor(node.name);
    const label = node.subtype ?? kind;
    return (
        <a
            href={link.href}
            target={link.target}
            class={`cdx-rel-card cdx-rel-card--incoming cdx-rel-card--${kind}`}
            title={node.description || node.name}
        >
            <div class="cdx-rel-card-body">
                <span class="cdx-rel-card-label">{label}</span>
                <span class="cdx-rel-card-name">{node.name}</span>
                {node.description && <span class="cdx-rel-card-desc">{node.description}</span>}
            </div>
            <span class="cdx-rel-card-indicator" aria-hidden="true">
                {IconExternalLink()}
            </span>
        </a>
    ) as string;
};

/** Card rendered under the "Depends On" column — compact row with icon box. */
const OutgoingCard = (node: RelationshipNode): string => {
    const kind = normaliseType(node.type);
    const link = linkFor(node.name);
    const label = node.subtype ?? kind;
    return (
        <a
            href={link.href}
            target={link.target}
            class={`cdx-rel-card cdx-rel-card--outgoing cdx-rel-card--${kind}`}
            title={node.description || node.name}
        >
            <span class={`cdx-rel-card-icon cdx-rel-card-icon--${kind}`} aria-hidden="true">
                {iconFor(node.type)}
            </span>
            <div class="cdx-rel-card-body">
                <span class="cdx-rel-card-name">{node.name}</span>
                <span class="cdx-rel-card-label">{label}</span>
            </div>
        </a>
    ) as string;
};

const RelationshipColumn = (props: {
    kind: 'incoming' | 'outgoing';
    title: string;
    items: RelationshipNode[];
}): string => {
    if (!props.items?.length) {
        return '';
    }
    return (
        <div class={`cdx-rel-column cdx-rel-column--${props.kind}`}>
            <h4 class="cdx-rel-column-title">
                {props.title}
                <span class="cdx-rel-column-count">{props.items.length}</span>
            </h4>
            <div class={`cdx-rel-grid cdx-rel-grid--${props.kind}`}>
                {props.items.map(n =>
                    props.kind === 'incoming' ? IncomingCard(n) : OutgoingCard(n)
                )}
            </div>
        </div>
    ) as string;
};

export const BlockRelationshipGraph = (props: BlockRelationshipGraphProps): string => {
    if (!props.incoming?.length && !props.outgoing?.length) {
        return '';
    }

    return (
        <section class="cdx-content-section" data-compodoc="block-relationships">
            <h3 class="cdx-section-heading">{t('relationships') || 'Relationships'}</h3>
            <div class="cdx-relationships">
                {RelationshipColumn({
                    kind: 'incoming',
                    title: t('relationships-used-by') || 'Used by',
                    items: props.incoming
                })}
                {RelationshipColumn({
                    kind: 'outgoing',
                    title: t('relationships-depends-on') || 'Depends on',
                    items: props.outgoing
                })}
            </div>
        </section>
    ) as string;
};
