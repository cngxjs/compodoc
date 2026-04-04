import Html from '@kitajs/html';
import {
    extractJsdocExamples,
    hasJsdocParams,
    linkTypeHtml,
    modifKind,
    parseDescription,
    t,
} from '../helpers';
import { DefinedInRow } from './DefinedInRow';
import { ParamsTable } from './ParamsTable';

const signalKindLabel = (kind: string): string => ({
    'signal': 'Signal',
    'computed': 'Computed',
    'linked-signal': 'LinkedSignal',
    'effect': 'Effect',
    'resource': 'Resource',
    'rx-resource': 'RxResource',
    'model': 'Model',
    'input-signal': 'Input Signal',
    'output-signal': 'Output Signal',
    'view-child': 'ViewChild',
    'view-children': 'ViewChildren',
    'content-child': 'ContentChild',
    'content-children': 'ContentChildren',
    'inject': 'Inject',
    'host-binding': 'Host',
    'host-listener': 'Host',
}[kind] || kind);

type BlockPropertyProps = {
    readonly properties: any[];
    readonly file: string;
    readonly title?: string;
    readonly depth?: number;
    readonly navTabs?: any[];
    readonly entityColor?: string;
};

export const BlockProperty = (props: BlockPropertyProps): string => {
    return (
        <section data-compodoc="block-properties">
            {typeof props.title === 'string'
                ? <h3>{props.title}</h3>
                : <h3 id="inputs">{t('properties')}</h3>
            }
            {props.properties.map(p => {
                const cardClasses = p.deprecated
                    ? 'cdx-member-card cdx-member-card--deprecated'
                    : 'cdx-member-card';

                return (
                    <article class={cardClasses} id={p.name}>

                        <header class="cdx-member-header">
                            <span class="cdx-member-name">
                                {(p.modifierKind ?? []).map((k: number) => (
                                    <span class="modifier">{modifKind(k)}</span>
                                ))}
                                {p.optional && <span class="modifier">{t('optional')}</span>}
                                <span class={`cdx-member-name-text${p.deprecated ? ' deprecated-name' : ''}`}>{p.name}</span>
                                {p.signalKind && <span class={`cdx-badge cdx-badge--${p.signalKind}`}>{signalKindLabel(p.signalKind)}</span>}
                                {p.required && <span class="cdx-badge cdx-badge--factory">Required</span>}
                                <a href={`#${p.name}`} class="cdx-member-permalink" aria-label={`Link to ${p.name}`}>#</a>
                            </span>
                            {p.type && <span class="cdx-member-type">{linkTypeHtml(p.type)}</span>}
                        </header>
                        <div class="cdx-member-body">
                            {p.deprecated && (
                                <div class="cdx-member-deprecation">{p.deprecationMessage || t('deprecated')}</div>
                            )}
                            {p.defaultValue && (
                                <div class="cdx-member-row"><i>{t('default-value')} : </i><code>{p.defaultValue}</code></div>
                            )}
                            {p.decorators && (
                                <div class="cdx-member-row">
                                    <b>{t('decorators')} : </b>
                                    <code>{p.decorators.map((d: any) =>
                                        d.stringifiedArguments ? `@${d.name}(${d.stringifiedArguments})` : `@${d.name}()`
                                    ).join(', ')}</code>
                                </div>
                            )}
                            {DefinedInRow({ line: p.line, file: props.file, inheritance: p.inheritance, navTabs: props.navTabs })}
                            {p.description && (
                                <div class="io-description">{parseDescription(p.description, props.depth ?? 0)}</div>
                            )}
                            {p.jsdoctags && hasJsdocParams(p.jsdoctags) && (
                                <div class="io-description">
                                    {ParamsTable({ jsdocTags: p.jsdoctags, depth: props.depth ?? 0, showOptional: false, showDefaultValue: false })}
                                    {(() => {
                                        const examples = extractJsdocExamples(p.jsdoctags);
                                        if (examples.length === 0) return '';
                                        return (<>
                                            <b>{t('example')} :</b>
                                            {examples.map(ex => <div class="jsdoc-example-ul">{ex.comment}</div>)}
                                        </>);
                                    })()}
                                </div>
                            )}
                        </div>
                    </article>
                );
            })}
        </section>
    ) as string;
};
