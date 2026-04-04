import Html from '@kitajs/html';
import { linkTypeHtml, parseDescription, t } from '../helpers';
import { DefinedInRow } from './DefinedInRow';

type BlockOutputProps = {
    readonly element: any;
    readonly file: string;
    readonly depth?: number;
    readonly navTabs?: any[];
    readonly entityColor?: string;
};

export const BlockOutput = (props: BlockOutputProps): string => {
    return (
        <section data-compodoc="block-outputs">
            <h3 id="outputs">{t('outputs')}</h3>
            {(props.element.outputsClass ?? []).map((out: any) => (
                <article class="cdx-member-card" id={out.name}>

                    <header class="cdx-member-header">
                        <span class="cdx-member-name">
                            <span class="cdx-member-name-text">{out.name}</span>
                            {out.signalKind && <span class={`cdx-badge cdx-badge--${out.signalKind}`}>{out.signalKind === 'output-signal' ? 'Signal' : ''}</span>}
                            <a href={`#${out.name}`} class="cdx-member-permalink" aria-label={`Link to ${out.name}`}>#</a>
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
};
