import Html from '@kitajs/html';
import { t } from '../helpers';
import { BlockMethod } from '../blocks/BlockMethod';
import { IndexMisc } from '../blocks/IndexMisc';

type MiscFunctionsProps = {
    readonly miscellaneous: {
        readonly functions: any[];
        readonly groupedFunctions: Record<string, any[]>;
    };
    readonly depth?: number;
};

const factoryKindLabel: Record<string, string> = {
    provider: 'Provider',
    feature: 'Feature',
    inject: 'Inject',
    factory: 'Factory',
};

const FunctionBadges = (fn: any): string => {
    const badges: string[] = [];
    if (fn.factoryKind) badges.push(<span class="cdx-badge cdx-badge--factory">{factoryKindLabel[fn.factoryKind] || fn.factoryKind}</span> as string);
    if (fn.functionalKind) badges.push(<span class="cdx-badge cdx-badge--standalone">{fn.functionalKind.charAt(0).toUpperCase() + fn.functionalKind.slice(1)}</span> as string);
    if (fn.beta) badges.push(<span class="cdx-badge cdx-badge--beta">Beta</span> as string);
    if (fn.since) badges.push(<span class="cdx-badge cdx-badge--since">v{fn.since}</span> as string);
    if (fn.signal) badges.push(<span class="cdx-badge cdx-badge--signal">Signal</span> as string);
    return badges.join('');
};

export const MiscellaneousFunctions = (props: MiscFunctionsProps): string => (
    <>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('miscellaneous')}</li>
            <li class="breadcrumb-item">{t('functions')}</li>
        </ol>
        {IndexMisc({ list: props.miscellaneous.functions })}
        {Object.entries(props.miscellaneous.groupedFunctions).map(([key, methods]) => (<>
            <h3>{key}</h3>
            {(methods as any[]).map(fn => FunctionBadges(fn)).join('') ? (
                <div class="cdx-function-badges">
                    {(methods as any[]).map(fn => fn.factoryKind || fn.beta || fn.since || fn.signal ? (
                        <div class="cdx-function-badge-row">
                            <code>{fn.name}</code> {FunctionBadges(fn)}
                        </div>
                    ) : '').join('')}
                </div>
            ) : ''}
            {BlockMethod({ methods, title: '', file: '', depth: props.depth })}
        </>))}
    </>
) as string;
