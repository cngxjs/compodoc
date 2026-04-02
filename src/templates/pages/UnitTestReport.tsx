import Html from '@kitajs/html';
import { relativeUrl, t } from '../helpers';

type CoverageMetric = {
    readonly coveragePercent: number;
    readonly coverageCount: string;
    readonly status: string;
};

type UnitTestFile = {
    readonly name?: string;
    readonly filePath: string;
    readonly linktype?: string;
    readonly linksubtype?: string;
    readonly statements: CoverageMetric;
    readonly branches: CoverageMetric;
    readonly functions: CoverageMetric;
    readonly lines: CoverageMetric;
};

type UnitTestReportProps = {
    readonly files: UnitTestFile[];
    readonly idColumn?: boolean;
    readonly data: { readonly depth: number };
};

const MetricCell = (props: { metric: CoverageMetric }): string => (
    <td align="right" data-sort={String(props.metric.coveragePercent)} class={props.metric.status}>
        <span class="coverage-percent">{props.metric.coveragePercent} %</span>
        <span class="coverage-count">({props.metric.coverageCount})</span>
    </td>
) as string;

const fileLink = (f: UnitTestFile): string | null => {
    if (!f.linktype) return null;
    if (f.linksubtype) return `./${f.linktype}/${f.linksubtype}s.html#${f.name}`;
    return `./${f.linktype}s/${f.name}.html`;
};

export const UnitTestReport = (props: UnitTestReportProps): string => {
    const base = relativeUrl(props.data.depth);
    return (<>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('unit-test-coverage')}</li>
        </ol>

        <div>
            <img src="./images/coverage-badge-statements.svg" />
            <img src="./images/coverage-badge-branches.svg" />
            <img src="./images/coverage-badge-functions.svg" />
            <img src="./images/coverage-badge-lines.svg" />
        </div>

        <table class="table table-bordered coverage" id="coverage-table">
            <thead class="coverage-header">
                <tr>
                    <th>{t('file')}</th>
                    {props.idColumn && <th>{t('identifier')}</th>}
                    <th style="text-align:right" class="statements" data-sort-default>{t('statements')}</th>
                    <th style="text-align:right" class="statements" data-sort-default>{t('branches')}</th>
                    <th style="text-align:right" class="statements" data-sort-default>{t('functions')}</th>
                    <th style="text-align:right" class="statements" data-sort-default>{t('lines')}</th>
                </tr>
            </thead>
            <tbody>
                {props.files.filter(f => f.name).map(f => {
                    const href = fileLink(f);
                    return (
                        <tr>
                            <td>{href ? <a href={href}>{f.filePath}</a> : f.filePath}</td>
                            {props.idColumn && <td>{f.name}</td>}
                            <MetricCell metric={f.statements} />
                            <MetricCell metric={f.branches} />
                            <MetricCell metric={f.functions} />
                            <MetricCell metric={f.lines} />
                        </tr>
                    );
                })}
            </tbody>
        </table>

        <script src={`${base}js/libs/tablesort.min.js`}></script>
        <script src={`${base}js/libs/tablesort.number.min.js`}></script>
        <script>{'new Tablesort(document.getElementById(\'coverage-table\'));'}</script>
    </>) as string;
};
