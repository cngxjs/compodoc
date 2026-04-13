const SIGNAL_KIND_LABELS: Record<string, string> = {
    signal: 'signal()',
    computed: 'computed()',
    'linked-signal': 'linkedSignal()',
    effect: 'effect()',
    resource: 'resource()',
    'rx-resource': 'rxResource()',
    model: 'model()',
    'input-signal': 'input()',
    'output-signal': 'output()',
    'view-child': 'viewChild()',
    'view-children': 'viewChildren()',
    'content-child': 'contentChild()',
    'content-children': 'contentChildren()',
    inject: 'inject()',
    'after-render': 'afterRender()',
    'after-next-render': 'afterNextRender()',
    'after-every-render': 'afterEveryRender()',
    'after-render-effect': 'afterRenderEffect()',
    'host-binding': 'Host',
    'host-listener': 'Host'
};

/** Map a signalKind string to its display label. Falls back to the raw kind. */
export const signalKindLabel = (kind: string): string => SIGNAL_KIND_LABELS[kind] || kind;
