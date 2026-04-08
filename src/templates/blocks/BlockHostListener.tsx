import Html from '@kitajs/html';
import {
    hasJsdocParams,
    jsdocReturnsComment,
    linkTypeHtml,
    modifKind,
    parseDescription,
    t
} from '../helpers';
import { IconChevronRight } from '../components/Icons';
import { DefinedInRow } from './DefinedInRow';
import { JsdocExamplesBlock } from './JsdocExamplesBlock';
import { ParamsTable } from './ParamsTable';

type BlockHostListenerProps = {
    readonly methods: any[];
    readonly file: string;
    readonly title?: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockHostListener = (props: BlockHostListenerProps): string => {
    return (
        <section data-compodoc="block-host-listener">
            {typeof props.title === 'string' ? (
                <h3>{props.title}</h3>
            ) : (
                <h3 id="methods">{t('methods')}</h3>
            )}
            {props.methods.map(m => {
                const cardClasses = m.deprecated
                    ? 'cdx-member-card cdx-member-card--deprecated'
                    : 'cdx-member-card';

                return (
                    <article class={cardClasses} id={m.name}>
                        <details open>
                            <summary>
                                <header class="cdx-member-header">
                                    <span class="cdx-member-name">
                                        {(m.modifierKind ?? []).map((k: number) => (
                                            <span class="modifier">{modifKind(k)}</span>
                                        ))}
                                        {m.optional && (
                                            <span class="modifier">{t('optional')}</span>
                                        )}
                                        <span
                                            class={`cdx-member-name-text${m.deprecated ? ' deprecated-name' : ''}`}
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
                                        <span class="cdx-member-chevron" aria-hidden="true">
                                            {IconChevronRight()}
                                        </span>
                                    </span>
                                </header>
                            </summary>
                            <div class="cdx-member-body">
                                {m.deprecated && (
                                    <div class="cdx-member-deprecation">
                                        {m.deprecationMessage || t('deprecated')}
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
                                    <div class="io-description">
                                        {parseDescription(m.description, props.depth ?? 0)}
                                    </div>
                                )}
                                {m.jsdoctags && hasJsdocParams(m.jsdoctags) && (
                                    <>
                                        <div class="io-description">
                                            {ParamsTable({
                                                jsdocTags: m.jsdoctags,
                                                depth: props.depth ?? 0,
                                                showOptional: true,
                                                showDefaultValue: true
                                            })}
                                        </div>
                                        {JsdocExamplesBlock({ tags: m.jsdoctags, variant: 'code' })}
                                    </>
                                )}
                                {m.returnType && (
                                    <div class="cdx-member-returns">
                                        <b>{t('returns')} : </b>
                                        {linkTypeHtml(m.returnType)}
                                    </div>
                                )}
                                {m.returnType && m.jsdoctags && (
                                    <div class="io-description">
                                        {jsdocReturnsComment(m.jsdoctags)}
                                    </div>
                                )}
                            </div>
                        </details>
                    </article>
                );
            })}
        </section>
    ) as string;
};
