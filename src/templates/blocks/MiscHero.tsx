import Html from '@kitajs/html';
import { t } from '../helpers';
import { IconFunction, IconVariable, IconTypealias, IconEnum } from '../components/Icons';

type MiscKind = 'function' | 'variable' | 'typealias' | 'enum';

const MISC_META: Record<MiscKind, { color: string; icon: () => string; label: string; plural: string }> = {
    function: { color: 'var(--color-cdx-entity-function)', icon: IconFunction, label: 'Function', plural: 'functions' },
    variable: { color: 'var(--color-cdx-entity-service)', icon: IconVariable, label: 'Variable', plural: 'variables' },
    typealias: { color: 'var(--color-cdx-entity-typealias)', icon: IconTypealias, label: 'Type Alias', plural: 'type-aliases' },
    enum: { color: 'var(--color-cdx-entity-enum)', icon: IconEnum, label: 'Enumeration', plural: 'enumerations' },
};

type MiscHeroProps = {
    readonly kind: MiscKind;
    readonly count: number;
};

export const MiscHero = (props: MiscHeroProps): string => {
    const meta = MISC_META[props.kind];
    return (
        <div class="cdx-entity-hero" style={`--cdx-hero-color: ${meta.color}`}>
            <div class="cdx-entity-hero-watermark" aria-hidden="true">{meta.icon()}</div>
            <span class="cdx-entity-hero-file cdx-entity-hero-file--breadcrumb">{t('miscellaneous')} &gt; {t(meta.plural)}</span>
            <h1 class="cdx-entity-hero-name">{t(meta.plural)}</h1>
            <div class="cdx-entity-hero-badges">
                <span class={`cdx-badge cdx-badge--entity-${props.kind}`}>{meta.label}</span>
                <span class="cdx-badge cdx-badge--outline">{props.count}</span>
            </div>
        </div>
    ) as string;
};
