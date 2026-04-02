import Html from '@kitajs/html';
import { shortUrl, t } from '../helpers';

type MiscItem = {
    readonly name: string;
    readonly file: string;
    readonly deprecated?: boolean;
};

type IndexMiscProps = {
    readonly list: MiscItem[];
};

export const IndexMisc = (props: IndexMiscProps): string => (
    <section data-compodoc="block-index">
        <h3 id="index">{t('index')}</h3>
        <table class="table table-sm table-bordered index-table">
            <tbody>
                <tr>
                    <td class="col-md-4">
                        <ul class="index-list">
                            {props.list.map(item => (
                                <li>
                                    <a href={`#${item.name}`} title={item.file} class={item.deprecated ? 'deprecated-name' : ''}>
                                        <b>{item.name}</b>&nbsp;&nbsp;&nbsp;({shortUrl(item.file)})
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </td>
                </tr>
            </tbody>
        </table>
    </section>
) as string;
