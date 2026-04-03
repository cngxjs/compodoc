import Html from '@kitajs/html';
import { relativeUrl, t } from '../helpers';

type CoverageFile = {
    readonly status: string;
    readonly filePath: string;
    readonly name: string;
    readonly type: string;
    readonly linktype: string;
    readonly linksubtype?: string;
    readonly coveragePercent: number;
    readonly coverageCount: string;
};

type CoverageReportProps = {
    readonly files: CoverageFile[];
    readonly data: { readonly depth: number };
};

const fileLink = (f: CoverageFile): string => {
    if (f.linksubtype) {
        const suffix = f.type === 'type alias' ? 'es' : 's';
        return `./` + f.linktype + '/' + f.linksubtype + suffix + '.html#' + f.name;
    }
    if (f.linktype === 'entity') {
        return `./entities/${f.name}.html`;
    }
    return `./${f.linktype}s/${f.name}.html`;
};

export const CoverageReport = (props: CoverageReportProps): string => {
    const base = relativeUrl(props.data.depth);
    return (<>
        <ol class="cdx-breadcrumb">
            <li class="">{t('coverage-page-title')}</li>
        </ol>

        <div>
            <img src="./images/coverage-badge-documentation.svg" />
        </div>

        <table class="table table-bordered coverage" id="coverage-table">
            <thead class="coverage-header">
                <tr>
                    <th>{t('file')}</th>
                    <th>{t('type')}</th>
                    <th>{t('identifier')}</th>
                    <th style="text-align:right" class="statements" data-sort-default>{t('statements')}</th>
                </tr>
            </thead>
            <tbody>
                {props.files.map(f => (
                    <tr class={f.status}>
                        <td><a href={fileLink(f)}>{f.filePath}</a></td>
                        <td>{f.type}</td>
                        <td>{f.name}</td>
                        <td align="right" data-sort={String(f.coveragePercent)}>
                            <span class="coverage-percent">{f.coveragePercent} %</span>
                            <span class="coverage-count">({f.coverageCount})</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

        <script src={`${base}js/libs/tablesort.min.js`}></script>
        <script src={`${base}js/libs/tablesort.number.min.js`}></script>
        <script>{'new Tablesort(document.getElementById(\'coverage-table\'));'}</script>
    </>) as string;
};
