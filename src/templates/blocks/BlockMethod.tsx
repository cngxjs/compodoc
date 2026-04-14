import Html from '@kitajs/html';
import {
    functionSignature,
    hasJsdocParams,
    isTabEnabled,
    jsdocReturnsComment,
    linkTypeHtml,
    modifKind,
    parseDescription,
    t
} from '../helpers';
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
                <a class="cdx-member-permalink" href={`#${props.title ? props.title.toLowerCase() : 'methods'}`}>#</a>
            </h3>
            {props.methods.map((m: any) => {
                const cls = ['cdx-io-member', 'cdx-io-member--method'];
                if (m.deprecated) {
                    cls.push('cdx-io-member--deprecated');
                }
                return (
                    <div class={cls.join(' ')} id={m.name}>
                        <div class="cdx-io-member-title">
                            <span
                                class={`cdx-io-member-name${m.deprecated ? ' cdx-member-name--deprecated' : ''}`}
                            >
                                {m.name}
                                <a class="cdx-member-permalink" href={`#${m.name}`}>#</a>
                            </span>
                            {m.returnType && (
                                <span class="cdx-io-member-type">
                                    {linkTypeHtml(m.returnType)}
                                </span>
                            )}
                        </div>
                        <div class="cdx-io-member-badges">
                            {(m.modifierKind ?? []).map((k: number) => (
                                <span class="cdx-member-modifier">
                                    {modifKind(k)}
                                </span>
                            ))}
                            {m.optional && (
                                <span class="cdx-member-modifier">{t('optional')}</span>
                            )}
                        </div>
                        {m.deprecated && m.deprecationMessage && (
                            <div class="cdx-member-deprecated">
                                {m.deprecationMessage}
                            </div>
                        )}
                        {m.args?.length > 0 && (
                            <pre class="cdx-derived-body"><code>{functionSignature(m)}</code></pre>
                        )}
                        {m.description && (
                            <div class="cdx-io-member-desc">
                                {parseDescription(m.description, props.depth ?? 0)}
                            </div>
                        )}
                        {m.jsdoctags && hasJsdocParams(m.jsdoctags) && (
                            <div class="cdx-io-member-desc">
                                {ParamsTable({
                                    jsdocTags: m.jsdoctags,
                                    depth: props.depth ?? 0,
                                    showOptional: true,
                                    showDefaultValue: true
                                })}
                            </div>
                        )}
                        {m.returnType && m.jsdoctags && (
                            <div class="cdx-io-member-desc">
                                {jsdocReturnsComment(m.jsdoctags)}
                            </div>
                        )}
                        {m.line && isTabEnabled(props.navTabs, 'source') && (
                            <div class="cdx-io-member-source">
                                {/* biome-ignore lint/a11y/useValidAnchor: href rewritten by client JS via data-cdx-line */}
                                <a href="#" data-cdx-line={String(m.line)}>
                                    {props.file}:{m.line}
                                </a>
                            </div>
                        )}
                    </div>
                );
            })}
        </section>
    ) as string;
};
