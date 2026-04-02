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
            <table class="table table-sm table-bordered">
                <tbody>
                    <tr>
                        <td class="col-md-4">
                            <span id={m.name}></span>
                            <span class="name">
                                {(m.modifierKind ?? []).map((k: number) => (
                                    <span class="modifier">{modifKind(k)}</span>
                                ))}
                                {m.optional && <span class="modifier">{t('optional')}</span>}
                                <span class={m.deprecated ? 'deprecated-name' : ''}><b>{m.name}</b></span>
                                <a href={`#${m.name}`}><span class="icon ion-ios-link"></span></a>
                            </span>
                        </td>
                    </tr>
                    {m.deprecated && (
                        <tr><td class="col-md-4 deprecated">{m.deprecationMessage}</td></tr>
                    )}
                    {m.argsDecorator && (
                        <tr>
                            <td class="col-md-4">
                                <i>{t('arguments')} : </i><code>{m.argsDecorator.map((a: string) => `'${a}' `).join('')}</code>
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td class="col-md-4">
                            {m.modifierKind && <span class={`modifier-icon icon ion-ios-${modifIcon(m.modifierKind)}`}></span>}
                            <code>{functionSignature(m)}</code>
                        </td>
                    </tr>
                    {m.decorators && (
                        <tr>
                            <td class="col-md-4">
                                <b>{t('decorators')} : </b><br />
                                <code>{m.decorators.map((d: any) =>
                                    d.stringifiedArguments ? `@${d.name}(${d.stringifiedArguments})` : `@${d.name}()`
                                ).join('<br />')}</code>
                            </td>
                        </tr>
                    )}
                    {DefinedInRow({ line: m.line, file: props.file, inheritance: m.inheritance, navTabs: props.navTabs })}
                    {m.typeParameters?.length > 0 && (
                        <tr>
                            <td class="col-md-4">
                                <b>{t('type-parameters')} :</b>
                                <ul class="type-parameters">
                                    {m.typeParameters.map((tp: string) => <li>{tp}</li>)}
                                </ul>
                            </td>
                        </tr>
                    )}
                    {(m.jsdoctags || m.returnType || m.description) && (
                        <tr>
                            <td class="col-md-4">
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
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        ))}
    </section>
) as string;
