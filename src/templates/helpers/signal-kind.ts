const SIGNAL_KIND_LABELS: Record<string, string> = {
    signal: 'Signal',
    computed: 'Computed',
    'linked-signal': 'LinkedSignal',
    effect: 'Effect',
    resource: 'Resource',
    'rx-resource': 'RxResource',
    model: 'Model',
    'input-signal': 'Input Signal',
    'output-signal': 'Output Signal',
    'view-child': 'ViewChild',
    'view-children': 'ViewChildren',
    'content-child': 'ContentChild',
    'content-children': 'ContentChildren',
    inject: 'Inject',
    'after-render': 'afterRender',
    'after-next-render': 'afterNextRender',
    'after-every-render': 'afterEveryRender',
    'after-render-effect': 'afterRenderEffect',
    'host-binding': 'Host',
    'host-listener': 'Host'
};

/** Map a signalKind string to its display label. Falls back to the raw kind. */
export const signalKindLabel = (kind: string): string => SIGNAL_KIND_LABELS[kind] || kind;
