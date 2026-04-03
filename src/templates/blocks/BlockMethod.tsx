import Html from '@kitajs/html';
import {
    extractJsdocCodeExamples,
    functionSignature,
    hasJsdocParams,
    jsdocReturnsComment,
    linkTypeHtml,
    modifIcon,
    modifKind,
    parseDescription,
    t,
} from '../helpers';
import { DefinedInRow } from './DefinedInRow';
import { ParamsTable } from './ParamsTable';

type BlockMethodProps = {
    readonly methods: any[];
    readonly file: string;
    readonly title?: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockMethod = (props: BlockMethodProps): string => (
    <section data-compodoc="block-methods">
        {typeof props.title === 'string'
            ? <h3>{props.title}</h3>
            : <h3 id="methods">{t('methods')}</h3>
        }
        {props.methods.map(m => (
            <article class={`cdx-member-card${m.deprecated ? ' cdx-member-card--deprecated' : ''}`} id={m.name}>
                <header class="cdx-member-header">
                    <span class="cdx-member-name">
                        {(m.modifierKind ?? []).map((k: number) => (
                            <span class="modifier">{modifKind(k)}</span>
                        ))}
                        {m.optional && <span class="modifier">{t('optional')}</span>}
                        <span class={m.deprecated ? 'deprecated-name' : ''}>{m.name}</span>
                        <a href={`#${m.name}`} aria-label={`Link to ${m.name}`}>#</a>
                    </span>
                    {m.returnType && <span class="cdx-member-type">{linkTypeHtml(m.returnType)}</span>}
                </header>
                <div class="cdx-member-body">
                    {m.deprecated && (
                        <div class="cdx-member-deprecated">{m.deprecationMessage}</div>
                    )}
                    {m.argsDecorator && (
                        <div class="cdx-member-row">
                            <i>{t('arguments')} : </i><code>{m.argsDecorator.map((a: string) => `'${a}' `).join('')}</code>
                        </div>
                    )}
                    <div class="cdx-member-row">
                        <code>{functionSignature(m)}</code>
                    </div>
                    {m.decorators && (
                        <div class="cdx-member-row">
                            <b>{t('decorators')} : </b>
                            <code>{m.decorators.map((d: any) =>
                                d.stringifiedArguments ? `@${d.name}(${d.stringifiedArguments})` : `@${d.name}()`
                            ).join(', ')}</code>
                        </div>
                    )}
                    {DefinedInRow({ line: m.line, file: props.file, inheritance: m.inheritance, navTabs: props.navTabs })}
                    {m.typeParameters?.length > 0 && (
                        <div class="cdx-member-row">
                            <b>{t('type-parameters')} :</b>
                            <ul class="type-parameters">
                                {m.typeParameters.map((tp: string) => <li>{tp}</li>)}
                            </ul>
                        </div>
                    )}
                    {m.description && (
                        <div class="io-description">{parseDescription(m.description, props.depth ?? 0)}</div>
                    )}
                    {m.jsdoctags && hasJsdocParams(m.jsdoctags) && (
                        <div class="io-description">
                            {ParamsTable({ jsdocTags: m.jsdoctags, depth: props.depth ?? 0, showOptional: true, showDefaultValue: true })}
                        </div>
                    )}
                    {m.returnType && (<>
                        <div class="io-description">
                            <b>{t('returns')} : </b>{linkTypeHtml(m.returnType)}
                        </div>
                        {m.jsdoctags && (
                            <div class="io-description">{jsdocReturnsComment(m.jsdoctags)}</div>
                        )}
                    </>)}
                </div>
            </article>
        ))}
    </section>
) as string;
