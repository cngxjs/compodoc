import Html from '@kitajs/html';
import { linkTypeHtml, parseDescription, signalKindLabel, t } from '../helpers';
import { DefinedInRow } from './DefinedInRow';
import { MemberCard } from './MemberCard';

type BlockOutputProps = {
    readonly element: any;
    readonly file: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockOutput = (props: BlockOutputProps): string => {
    return (
        <section data-compodoc="block-outputs">
            <h3 id="outputs">{t('outputs')}</h3>
            {(props.element.outputsClass ?? []).map((out: any) => {
                const header = (
                    <header class="cdx-member-header">
                        <span class="cdx-member-name">
                            <span
                                class={`cdx-member-name-text${out.deprecated ? ' cdx-member-name--deprecated' : ''}`}
                            >
                                {out.name}
                            </span>
                            {out.signalKind && (
                                <span class={`cdx-badge cdx-badge--${out.signalKind}`}>
                                    {signalKindLabel(out.signalKind)}
                                </span>
                            )}
                            <a
                                href={`#${out.name}`}
                                class="cdx-member-permalink"
                                aria-label={`Link to ${out.name}`}
                            >
                                #
                            </a>
                        </span>
                        {out.type && <span class="cdx-member-type">{linkTypeHtml(out.type)}</span>}
                    </header>
                ) as string;

                const body = (
                    <>
                        {DefinedInRow({
                            line: out.line,
                            file: props.element.file,
                            inheritance: out.inheritance,
                            navTabs: props.navTabs
                        })}
                        {out.description && (
                            <div class="cdx-member-description">
                                {parseDescription(out.description, props.depth ?? 0)}
                            </div>
                        )}
                    </>
                ) as string;

                return MemberCard({ id: out.name, header, children: body });
            })}
        </section>
    ) as string;
};
