import Html from '@kitajs/html';
import { linkTypeHtml, parseDescription, t } from '../helpers';
import { DefinedInRow } from './DefinedInRow';
import { MemberCard } from './MemberCard';

type BlockInputProps = {
    readonly element: any;
    readonly file: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockInput = (props: BlockInputProps): string => {
    return (
        <section data-compodoc="block-inputs">
            <h3 id="inputs">{t('inputs')}</h3>
            {(props.element.inputsClass ?? []).map((inp: any) => {
                const header = (
                    <header class="cdx-member-header">
                        <span class="cdx-member-name">
                            <span
                                class={`cdx-member-name-text${inp.deprecated ? ' cdx-member-name--deprecated' : ''}`}
                            >
                                {inp.name}
                            </span>
                            {inp.signalKind && (
                                <span class={`cdx-badge cdx-badge--${inp.signalKind}`}>
                                    {inp.signalKind === 'input-signal'
                                        ? 'Signal'
                                        : inp.signalKind === 'model'
                                          ? 'Model'
                                          : ''}
                                </span>
                            )}
                            {inp.required && (
                                <span class="cdx-badge cdx-badge--factory">Required</span>
                            )}
                            <a
                                href={`#${inp.name}`}
                                class="cdx-member-permalink"
                                aria-label={`Link to ${inp.name}`}
                            >
                                #
                            </a>
                        </span>
                        {inp.type && <span class="cdx-member-type">{linkTypeHtml(inp.type)}</span>}
                    </header>
                ) as string;

                const body = (
                    <>
                        {inp.required && (
                            <div class="cdx-member-row">
                                <i>{t('required')} : </i>
                                <b>{String(inp.required)}</b>
                            </div>
                        )}
                        {inp.defaultValue && (
                            <div class="cdx-member-row">
                                <i>{t('default-value')} : </i>
                                <code>{inp.defaultValue}</code>
                            </div>
                        )}
                        {DefinedInRow({
                            line: inp.line,
                            file: props.element.file,
                            inheritance: inp.inheritance,
                            navTabs: props.navTabs
                        })}
                        {inp.description && (
                            <div class="cdx-member-description">
                                {parseDescription(inp.description, props.depth ?? 0)}
                            </div>
                        )}
                    </>
                ) as string;

                return MemberCard({ id: inp.name, header, children: body });
            })}
        </section>
    ) as string;
};
