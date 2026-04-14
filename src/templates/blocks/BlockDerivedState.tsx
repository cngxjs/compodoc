import Html from '@kitajs/html';
import { isTabEnabled, linkTypeHtml, parseDescription, signalKindLabel, t } from '../helpers';

type BlockDerivedStateProps = {
    readonly properties: any[];
    readonly allSignalProps: any[];
    readonly file: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockDerivedState = (props: BlockDerivedStateProps): string => {
    const signalNames = new Set(
        props.allSignalProps.filter((p: any) => p.signalKind).map((p: any) => p.name)
    );

    return (
        <section data-compodoc="block-derived-state">
            <h3 id="derived-state">
                {t('derived-state')}
                <a class="cdx-member-permalink" href="#derived-state">
                    #
                </a>
            </h3>
            {props.properties.map((p: any) => {
                const cls = ['cdx-io-member'];
                if (p.signalKind) {
                    cls.push(`cdx-io-member--${p.signalKind}`);
                }
                if (p.deprecated) {
                    cls.push('cdx-io-member--deprecated');
                }

                // Filter signalDeps to only include known signal properties
                const deps = (p.signalDeps ?? []).filter((d: string) => signalNames.has(d));

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
                        </div>
                        {deps.length > 0 && (
                            <div class="cdx-derived-chain">
                                {deps.map((dep: string, i: number) => (
                                    <>
                                        {i > 0 && <span class="cdx-derived-sep">{'\u00B7'}</span>}
                                        <a href={`#${dep}`} class="cdx-derived-dep">
                                            {dep}
                                        </a>
                                    </>
                                ))}
                                <span class="cdx-derived-arrow">{'\u2192'}</span>
                                <span class="cdx-derived-self">{p.name}</span>
                            </div>
                        )}
                        {p.description && (
                            <div class="cdx-io-member-desc">
                                {parseDescription(p.description, props.depth ?? 0)}
                            </div>
                        )}
                        {/* biome-ignore lint/style/useSelfClosingElements: pre must not have whitespace */}
                        {p.defaultValue && (
                            <pre class="cdx-derived-body">
                                <code>{p.defaultValue}</code>
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
