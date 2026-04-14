import Html from '@kitajs/html';
import { indexableSignature, isTabEnabled, linkTypeHtml, parseDescription, t } from '../helpers';

type BlockIndexSignaturesProps = {
    readonly indexables: any[];
    readonly file: string;
    readonly title?: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockIndexSignatures = (props: BlockIndexSignaturesProps): string =>
    (
        <section data-compodoc="block-indexables">
            <h3 id="indexables">{props.title ?? t('indexable')}</h3>
            {props.indexables.map((idx: any) => (
                <div class="cdx-io-member" id={idx.name ?? ''}>
                    <pre class="cdx-derived-body"><code>{indexableSignature(idx)}: {linkTypeHtml(idx.returnType)}</code></pre>
                    {idx.description && (
                        <div class="cdx-io-member-desc">
                            {parseDescription(idx.description, props.depth ?? 0)}
                        </div>
                    )}
                    {idx.line && isTabEnabled(props.navTabs, 'source') && (
                        <div class="cdx-io-member-source">
                            {/* biome-ignore lint/a11y/useValidAnchor: href rewritten by client JS via data-cdx-line */}
                            <a href="#" data-cdx-line={String(idx.line)}>
                                {props.file}:{idx.line}
                            </a>
                        </div>
                    )}
                </div>
            ))}
        </section>
    ) as string;
