import Html from '@kitajs/html';
import {
    isTabEnabled,
    linkTypeHtml,
    modifKind,
    parseDescription,
    signalKindLabel,
    t
} from '../helpers';
import { JsdocExamplesBlock } from './JsdocExamplesBlock';
import { ParamsTable } from './ParamsTable';

type BlockPropertyProps = {
    readonly properties: any[];
    readonly file: string;
    readonly title?: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

const isUndefined = (v: unknown): boolean => v === undefined || v === 'undefined' || v === '';

export const BlockProperty = (props: BlockPropertyProps): string => {
    return (
        <section data-compodoc="block-properties">
            <h3 id={props.title ? props.title.toLowerCase() : 'properties'}>
                {props.title ?? t('instance-properties')}
                <a
                    class="cdx-member-permalink"
                    href={`#${props.title ? props.title.toLowerCase() : 'properties'}`}
                >
                    #
                </a>
            </h3>
            {props.properties.map((p: any) => {
                const cls = ['cdx-io-member', 'cdx-io-member--property'];
                if (p.signalKind) {
                    cls.push(`cdx-io-member--${p.signalKind}`);
                }
                if (p.deprecated) {
                    cls.push('cdx-io-member--deprecated');
                }
                return (
                    <div class={cls.join(' ')} id={p.name}>
                        <div class="cdx-io-member-title">
                            <span
                                class={`cdx-io-member-name${p.deprecated ? ' cdx-member-name--deprecated' : ''}`}
                            >
                                {p.name}
                                <a class="cdx-member-permalink" href={`#${p.name}`}>
                                    #
                                </a>
                            </span>
                            {p.type && (
                                <span class="cdx-io-member-type">{linkTypeHtml(p.type)}</span>
                            )}
                        </div>
                        <div class="cdx-io-member-badges">
                            {p.signalKind && (
                                <span class={`cdx-badge cdx-badge--${p.signalKind}`}>
                                    {signalKindLabel(p.signalKind)}
                                </span>
                            )}
                            {(p.modifierKind ?? []).map((k: number) => (
                                <span class="cdx-member-modifier">{modifKind(k)}</span>
                            ))}
                            {p.optional && <span class="cdx-member-modifier">{t('optional')}</span>}
                            {p.required && (
                                <span class="cdx-badge cdx-badge--factory">Required</span>
                            )}
                        </div>
                        {p.deprecated && p.deprecationMessage && (
                            <div class="cdx-member-deprecated">{p.deprecationMessage}</div>
                        )}
                        {p.description && (
                            <div class="cdx-io-member-desc">
                                {parseDescription(p.description, props.depth ?? 0)}
                            </div>
                        )}
                        {p.jsdoctags?.length > 0 && (
                            <div class="cdx-io-member-desc">
                                {ParamsTable({
                                    jsdocTags: p.jsdoctags,
                                    depth: props.depth ?? 0,
                                    showOptional: false,
                                    showDefaultValue: false
                                })}
                                {JsdocExamplesBlock({
                                    tags: p.jsdoctags,
                                    variant: 'text',
                                    cssClass: 'jsdoc-example-ul'
                                })}
                            </div>
                        )}
                        {!isUndefined(p.defaultValue) && (
                            <pre class="cdx-derived-body">
                                <code>{String(p.defaultValue)}</code>
                            </pre>
                        )}
                        {p.line && isTabEnabled(props.navTabs, 'source') && (
                            <div class="cdx-io-member-source">
                                {/* biome-ignore lint/a11y/useValidAnchor: href rewritten by client JS via data-cdx-line */}
                                <a href="#" data-cdx-line={String(p.line)}>
                                    {props.file}:{p.line}
                                </a>
                            </div>
                        )}
                    </div>
                );
            })}
        </section>
    ) as string;
};
