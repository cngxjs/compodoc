import Html from '@kitajs/html';
import { indexableSignature, linkTypeHtml, parseDescription, t } from '../helpers';
import { DefinedInRow } from './DefinedInRow';
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
                {DefinedInRow({ line: idx.line, file: props.file, navTabs: props.navTabs })}
                {idx.description && (
                    <div class="cdx-member-description">{parseDescription(idx.description, props.depth ?? 0)}</div>
                )}
            </>) as string;

            return MemberCard({ id: idx.name ?? '', header, children: body });
        })}
    </section>
) as string;
