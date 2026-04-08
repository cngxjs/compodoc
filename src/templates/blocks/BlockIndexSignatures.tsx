import Html from '@kitajs/html';
import { indexableSignature, isTabEnabled, linkTypeHtml, parseDescription, t } from '../helpers';
import { MemberCard } from './MemberCard';

type BlockIndexSignaturesProps = {
    readonly indexables: any[];
    readonly file: string;
    readonly title?: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockIndexSignatures = (props: BlockIndexSignaturesProps): string => (
    <section data-compodoc="block-indexables">
        <h3 id="indexables">{props.title ?? t('indexable')}</h3>
        {props.indexables.map(idx => {
            const header = (
                <header class="cdx-member-header">
                    <span class="cdx-member-name">
                        <code>{indexableSignature(idx)}:{linkTypeHtml(idx.returnType)}</code>
                    </span>
                </header>
            ) as string;

            const body = (<>
                {idx.line && isTabEnabled(props.navTabs, 'source') && (
                    <div class="cdx-member-row">
                        {t('defined-in')}{' '}
                        <a href="" data-cdx-line={String(idx.line)} class="cdx-link-to-source">
                            {props.file}:{idx.line}
                        </a>
                    </div>
                )}
                {idx.description && (
                    <div class="io-description">{parseDescription(idx.description, props.depth ?? 0)}</div>
                )}
            </>) as string;

            return MemberCard({ id: idx.name ?? '', header, children: body });
        })}
    </section>
) as string;
