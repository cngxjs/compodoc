import Html from '@kitajs/html';
import { linkTypeHtml, parseDescription, t } from '../helpers';
import { DefinedInRow } from './DefinedInRow';

type BlockOutputProps = {
    readonly element: any;
    readonly file: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockOutput = (props: BlockOutputProps): string => (
    <section data-compodoc="block-outputs">
        <h3 id="outputs">{t('outputs')}</h3>
        {(props.element.outputsClass ?? []).map((out: any) => (
            <article class="cdx-member-card" id={out.name}>
                <header class="cdx-member-header">
                    <span class="cdx-member-name">
                        {out.name}
                        {out.signalKind && <span class={`cdx-badge cdx-badge--${out.signalKind}`}>{out.signalKind === 'output-signal' ? 'Signal' : ''}</span>}
                    </span>
                    {out.type && <span class="cdx-member-type">{linkTypeHtml(out.type)}</span>}
                </header>
                <div class="cdx-member-body">
                    {DefinedInRow({ line: out.line, file: props.element.file, inheritance: out.inheritance, navTabs: props.navTabs })}
                    {out.description && (
                        <div class="io-description">{parseDescription(out.description, props.depth ?? 0)}</div>
                    )}
                </div>
            </article>
        ))}
    </section>
) as string;
