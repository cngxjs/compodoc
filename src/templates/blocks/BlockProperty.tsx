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
};

export const BlockProperty = (props: BlockPropertyProps): string => (
    <section data-compodoc="block-properties">
        {typeof props.title === 'string'
            ? <h3>{props.title}</h3>
            : <h3 id="inputs">{t('properties')}</h3>
        }
        {props.properties.map(p => (
            <table class="table table-sm table-bordered">
                <tbody>
                    <tr>
                        <td class="col-md-4">
                            <span id={p.name}></span>
                            <span class="name">
                                {(p.modifierKind ?? []).map((k: number) => (
                                    <span class="modifier">{modifKind(k)}</span>
                                ))}
                                {p.optional && <span class="modifier">{t('optional')}</span>}
                                <span class={p.deprecated ? 'deprecated-name' : ''}><b>{p.name}</b></span>
                                {p.signalKind && <span class={`cdx-badge cdx-badge--${p.signalKind}`}>{signalKindLabel(p.signalKind)}</span>}
                                {p.required && <span class="cdx-badge cdx-badge--factory">Required</span>}
                                <a href={`#${p.name}`}><span class="icon ion-ios-link"></span></a>
                            </span>
                        </td>
                    </tr>
                    {p.deprecated && (
                        <tr><td class="col-md-4 deprecated">{p.deprecationMessage}</td></tr>
                    )}
                    {p.type && (
                        <tr><td class="col-md-4"><i>{t('type')} : </i>{linkTypeHtml(p.type)}</td></tr>
                    )}
                    {p.defaultValue && (
                        <tr><td class="col-md-4"><i>{t('default-value')} : </i><code>{p.defaultValue}</code></td></tr>
                    )}
                    {p.decorators && (
                        <tr>
                            <td class="col-md-4">
                                <b>{t('decorators')} : </b><br />
                                <code>{p.decorators.map((d: any) =>
                                    d.stringifiedArguments ? `@${d.name}(${d.stringifiedArguments})` : `@${d.name}()`
                                ).join('<br />')}</code>
                            </td>
                        </tr>
                    )}
                    {DefinedInRow({ line: p.line, file: props.file, inheritance: p.inheritance, navTabs: props.navTabs })}
                    {p.description && (
                        <tr><td class="col-md-4"><div class="io-description">{parseDescription(p.description, props.depth ?? 0)}</div></td></tr>
                    )}
                    {p.jsdoctags && hasJsdocParams(p.jsdoctags) && (
                        <tr>
                            <td class="col-md-4">
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
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        ))}
    </section>
) as string;
