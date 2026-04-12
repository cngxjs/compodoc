import Html from '@kitajs/html';
import {
    functionSignature,
    hasJsdocParams,
    jsdocReturnsComment,
    linkTypeHtml,
    modifKind,
    parseDescription,
    t
} from '../helpers';
import { DefinedInRow } from './DefinedInRow';
import { MemberCard } from './MemberCard';
import { ParamsTable } from './ParamsTable';

type BlockMethodProps = {
    readonly methods: any[];
    readonly file: string;
    readonly title?: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockMethod = (props: BlockMethodProps): string => {
    return (
        <section data-compodoc="block-methods">
            <h3 id={props.title ? props.title.toLowerCase() : 'methods'}>
                {props.title ?? t('methods')}
            </h3>
            {props.methods.map(m => {
                const header = (
                    <header class="cdx-member-header">
                        <span class="cdx-member-name">
                            {(m.modifierKind ?? []).map((k: number) => (
                                <span class="cdx-member-modifier">{modifKind(k)}</span>
                            ))}
                            {m.optional && <span class="cdx-member-modifier">{t('optional')}</span>}
                            <span
                                class={`cdx-member-name-text${m.deprecated ? ' cdx-member-name--deprecated' : ''}`}
                            >
                                {m.name}
                            </span>
                            <a
                                href={`#${m.name}`}
                                class="cdx-member-permalink"
                                aria-label={`Link to ${m.name}`}
                            >
                                #
                            </a>
                        </span>
                        <span class="cdx-member-type">
                            {m.returnType && linkTypeHtml(m.returnType)}
                        </span>
                    </header>
                ) as string;

                const body = (
                    <>
                        {m.deprecated && (
                            <div class="cdx-member-deprecated">
                                {m.deprecationMessage || t('deprecated')}
                            </div>
                        )}
                        {m.args?.length > 0 && (
                            <div class="cdx-member-signature">
                                <code>{functionSignature(m)}</code>
                            </div>
                        )}
                        {m.argsDecorator && (
                            <div class="cdx-member-row">
                                <i>{t('arguments')} : </i>
                                <code>
                                    {m.argsDecorator.map((a: string) => `'${a}' `).join('')}
                                </code>
                            </div>
                        )}
                        {m.decorators && (
                            <div class="cdx-member-row">
                                <b>{t('decorators')} : </b>
                                <code>
                                    {m.decorators
                                        .map((d: any) =>
                                            d.stringifiedArguments
                                                ? `@${d.name}(${d.stringifiedArguments})`
                                                : `@${d.name}()`
                                        )
                                        .join(', ')}
                                </code>
                            </div>
                        )}
                        {DefinedInRow({
                            line: m.line,
                            file: props.file,
                            inheritance: m.inheritance,
                            navTabs: props.navTabs
                        })}
                        {m.typeParameters?.length > 0 && (
                            <div class="cdx-member-row">
                                <b>{t('type-parameters')} :</b>
                                <ul class="type-parameters">
                                    {m.typeParameters.map((tp: string) => (
                                        <li>{tp}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {m.description && (
                            <div class="cdx-member-description">
                                {parseDescription(m.description, props.depth ?? 0)}
                            </div>
                        )}
                        {m.jsdoctags && hasJsdocParams(m.jsdoctags) && (
                            <div class="cdx-member-description">
                                {ParamsTable({
                                    jsdocTags: m.jsdoctags,
                                    depth: props.depth ?? 0,
                                    showOptional: true,
                                    showDefaultValue: true
                                })}
                            </div>
                        )}
                        {m.returnType && (
                            <div class="cdx-member-returns">
                                <b>{t('returns')} : </b>
                                {linkTypeHtml(m.returnType)}
                            </div>
                        )}
                        {m.returnType && m.jsdoctags && (
                            <div class="cdx-member-description">
                                {jsdocReturnsComment(m.jsdoctags)}
                            </div>
                        )}
                    </>
                ) as string;

                return MemberCard({
                    id: m.name,
                    deprecated: m.deprecated,
                    header,
                    children: body
                });
            })}
        </section>
    ) as string;
};
