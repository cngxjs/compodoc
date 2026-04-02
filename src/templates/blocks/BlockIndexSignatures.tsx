import Html from '@kitajs/html';
import { indexableSignature, isTabEnabled, linkTypeHtml, parseDescription, t } from '../helpers';

type BlockIndexSignaturesProps = {
    readonly indexables: any[];
    readonly file: string;
    readonly title?: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockIndexSignatures = (props: BlockIndexSignaturesProps): string => (
    <section data-compodoc="block-indexables">
        <h3 id="inputs">{props.title ?? t('indexable')}</h3>
        {props.indexables.map(idx => (
            <table class="table table-sm table-bordered">
                <tbody>
                    <tr>
                        <td class="col-md-4">
                            <code>{indexableSignature(idx)}:{linkTypeHtml(idx.returnType)}</code>
                        </td>
                    </tr>
                    {idx.line && isTabEnabled(props.navTabs, 'source') && (
                        <tr>
                            <td class="col-md-4">
                                <div class="io-line">{t('defined-in')} <a href="" data-line={String(idx.line)} class="link-to-prism">{props.file}:{idx.line}</a></div>
                            </td>
                        </tr>
                    )}
                    {idx.description && (
                        <tr><td class="col-md-4"><div class="io-description">{parseDescription(idx.description, props.depth ?? 0)}</div></td></tr>
                    )}
                </tbody>
            </table>
        ))}
    </section>
) as string;
