import { Html } from '@kitajs/html';
import { t } from '../helpers';
import { EmptyState } from '../components/EmptyState';
import { EmptyIconChart } from '../components/EmptyStateIcons';

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
    readonly data: { readonly count: number; readonly depth: number };
};

//Entity type → display & badge mapping
type GroupMeta = { label: string; badge: string; order: number };

const GROUP_META: Record<string, GroupMeta & { singular: string }> = {
    component: {
        label: 'Components',
        singular: 'Component',
        badge: 'cdx-badge--entity-component',
        order: 0
    },
    directive: {
        label: 'Directives',
        singular: 'Directive',
        badge: 'cdx-badge--entity-directive',
        order: 1
    },
    pipe: { label: 'Pipes', singular: 'Pipe', badge: 'cdx-badge--entity-pipe', order: 2 },
    injectable: {
        label: 'Injectables',
        singular: 'Injectable',
        badge: 'cdx-badge--entity-injectable',
        order: 3
    },
    class: { label: 'Classes', singular: 'Class', badge: 'cdx-badge--entity-class', order: 4 },
    interface: {
        label: 'Interfaces',
        singular: 'Interface',
        badge: 'cdx-badge--entity-interface',
        order: 5
    },
    guard: { label: 'Guards', singular: 'Guard', badge: 'cdx-badge--entity-guard', order: 6 },
    interceptor: {
        label: 'Interceptors',
        singular: 'Interceptor',
        badge: 'cdx-badge--entity-interceptor',
        order: 7
    },
    entity: { label: 'Entities', singular: 'Entity', badge: 'cdx-badge--entity-class', order: 8 },
    function: {
        label: 'Functions',
        singular: 'Function',
        badge: 'cdx-badge--entity-function',
        order: 9
    },
    variable: {
        label: 'Variables',
        singular: 'Variable',
        badge: 'cdx-badge--entity-variable',
        order: 10
    },
    'type alias': {
        label: 'Type Aliases',
        singular: 'Type Alias',
        badge: 'cdx-badge--entity-typealias',
        order: 11
    }
};

const fallbackMeta: GroupMeta & { singular: string } = {
    label: 'Other',
    singular: 'Other',
    badge: 'cdx-badge--entity-class',
    order: 99
};

/* ---- Progress bar color helper ---- */

const coverageFillClass = (pct: number): string => {
    if (pct <= 33) return 'cdx-coverage-fill--low';
    if (pct <= 66) return 'cdx-coverage-fill--medium';
    return 'cdx-coverage-fill--high';
};

/* ---- Shorten file path to last meaningful segments ---- */

const shortPath = (filePath: string): string => {
    const parts = filePath.replace(/\\/g, '/').split('/');
    // Find first "src" segment and show from there; fallback to last 3 segments
    const srcIdx = parts.lastIndexOf('src');
    if (srcIdx >= 0) return parts.slice(srcIdx).join('/');
    return parts.length <= 3 ? parts.join('/') : parts.slice(-3).join('/');
};

/* ---- File link builder ---- */

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

/* ---- SVG donut ---- */

const CIRCUMFERENCE = 2 * Math.PI * 50; // r=50

const DonutChart = (pct: number, total: number, documented: number, partial: number, undocumented: number): string => {
    // Three segments: green (documented), yellow (partial), red (undocumented)
    const docFrac = total > 0 ? documented / total : 0;
    const partFrac = total > 0 ? partial / total : 0;
    const undocFrac = total > 0 ? undocumented / total : 0;

    const docLen = CIRCUMFERENCE * docFrac;
    const partLen = CIRCUMFERENCE * partFrac;
    const undocLen = CIRCUMFERENCE * undocFrac;

    // Each segment starts where the previous ends (cumulative offset)
    const docOffset = 0;
    const partOffset = -(docLen);
    const undocOffset = -(docLen + partLen);

    const LIGHT = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };

    return (
        <svg
            viewBox="0 0 120 120"
            class="cdx-coverage-donut"
            role="img"
            aria-label={`Documentation coverage: ${pct}%`}
        >
            <title>{`Documentation coverage: ${pct}%`}</title>
            <desc>{`${documented} documented, ${partial} partial, ${undocumented} undocumented of ${total} entities`}</desc>
            {/* Background ring */}
            <circle cx="60" cy="60" r="50" fill="none"
                class="cdx-coverage-donut-ring" stroke-width="10" />
            {/* Green: fully documented */}
            {docLen > 0 && <circle cx="60" cy="60" r="50" fill="none"
                stroke={LIGHT.green} stroke-width="10"
                stroke-dasharray={`${docLen} ${CIRCUMFERENCE - docLen}`}
                stroke-dashoffset={String(docOffset)}
                transform="rotate(-90 60 60)"
                class="cdx-coverage-donut-segment">
                <title>{`Documented: ${documented} (${Math.round(docFrac * 100)}%)`}</title>
            </circle>}
            {/* Yellow: partial */}
            {partLen > 0 && <circle cx="60" cy="60" r="50" fill="none"
                stroke={LIGHT.yellow} stroke-width="10"
                stroke-dasharray={`${partLen} ${CIRCUMFERENCE - partLen}`}
                stroke-dashoffset={String(partOffset)}
                transform="rotate(-90 60 60)"
                class="cdx-coverage-donut-segment">
                <title>{`Partial: ${partial} (${Math.round(partFrac * 100)}%)`}</title>
            </circle>}
            {/* Red: undocumented */}
            {undocLen > 0 && <circle cx="60" cy="60" r="50" fill="none"
                stroke={LIGHT.red} stroke-width="10"
                stroke-dasharray={`${undocLen} ${CIRCUMFERENCE - undocLen}`}
                stroke-dashoffset={String(undocOffset)}
                transform="rotate(-90 60 60)"
                class="cdx-coverage-donut-segment">
                <title>{`Undocumented: ${undocumented} (${Math.round(undocFrac * 100)}%)`}</title>
            </circle>}
            {/* Center text — percentage only */}
            <text x="60" y="60" text-anchor="middle" dominant-baseline="central"
                class="cdx-coverage-donut-pct">{pct}%</text>
        </svg>
    ) as string;
};

const ChevronIcon = (): string =>
    (
        <svg
            class="cdx-coverage-group-chevron"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
        >
            <path d="M6 3l5 5-5 5" />
        </svg>
    ) as string;

const ProgressBar = (pct: number, mini = false): string => {
    const barClass = mini ? 'cdx-coverage-bar-mini' : 'cdx-coverage-bar';
    const fillClass = mini ? 'cdx-coverage-bar-mini-fill' : 'cdx-coverage-bar-fill';
    return (
        <span
            class={barClass}
            role="progressbar"
            aria-valuenow={String(pct)}
            aria-valuemin="0"
            aria-valuemax="100"
        >
            <span class={`${fillClass} ${coverageFillClass(pct)}`} style={`width:${pct}%`} />
        </span>
    ) as string;
};

export const CoverageReport = (props: CoverageReportProps): string => {
    const files = props.files;
    const overallPct = props.data.count;

    if (files.length === 0) {
        return (
            <>
                <ol class="cdx-breadcrumb">
                    <li>{t('coverage-page-title')}</li>
                </ol>
                {EmptyState({
                    icon: EmptyIconChart(),
                    title: t('no-documentation-coverage-data'),
                    description:
                        t('coverage-empty-description') ||
                        'Run compodoc with documented entities to see coverage.',
                    variant: 'page'
                })}
            </>
        ) as string;
    }

    //Group files by type
    const groups = new Map<string, CoverageFile[]>();
    for (const f of files) {
        const key = f.type;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(f);
    }

    // Sort groups by order, then sort files within each group by coverage asc */
    const sortedGroupKeys = [...groups.keys()].sort((a, b) => {
        const ma = GROUP_META[a] ?? fallbackMeta;
        const mb = GROUP_META[b] ?? fallbackMeta;
        return ma.order - mb.order;
    });

    // Compute stats
    const total = files.length;
    const documented = files.filter(f => f.coveragePercent === 100).length;
    const undocumented = files.filter(f => f.coveragePercent === 0).length;
    const partial = total - documented - undocumented;

    return (
        <>
            <ol class="cdx-breadcrumb">
                <li>{t('coverage-page-title')}</li>
            </ol>
            <div class="cdx-coverage-summary">
                {DonutChart(overallPct, total, documented, partial, undocumented)}
                <div class="cdx-coverage-stats">
                    <div>
                        <div class="cdx-coverage-stat-value">{total}</div>
                        <div class="cdx-coverage-stat-label">{t('total')}</div>
                    </div>
                    <div>
                        <div class="cdx-coverage-stat-value cdx-coverage-stat-value--documented">
                            {documented}
                        </div>
                        <div class="cdx-coverage-stat-label">{t('documented')}</div>
                    </div>
                    <div>
                        <div class="cdx-coverage-stat-value cdx-coverage-stat-value--partial">
                            {partial}
                        </div>
                        <div class="cdx-coverage-stat-label">{t('partial')}</div>
                    </div>
                    <div>
                        <div class="cdx-coverage-stat-value cdx-coverage-stat-value--undocumented">
                            {undocumented}
                        </div>
                        <div class="cdx-coverage-stat-label">{t('undocumented')}</div>
                    </div>
                </div>
            </div>

            <div class="cdx-coverage-filter">
                <input
                    type="text"
                    class="cdx-coverage-filter-input"
                    placeholder={t('filter-entities') || 'Filter entities...'}
                    aria-label={t('filter-coverage-results') || 'Filter coverage results'}
                    data-cdx-coverage-filter
                />
                <button
                    type="button"
                    class="cdx-coverage-filter-clear"
                    aria-label="Clear filter"
                    data-cdx-coverage-filter-clear
                >
                    &times;
                </button>
            </div>

            <div class="cdx-coverage-no-results" data-cdx-coverage-no-results>
                {t('no-matching-entities') || 'No matching entities'}
            </div>

            {sortedGroupKeys.map(typeKey => {
                const groupFiles = groups.get(typeKey)!;
                const meta = GROUP_META[typeKey] ?? fallbackMeta;

                groupFiles.sort((a, b) => a.coveragePercent - b.coveragePercent);

                const groupDocumented = groupFiles.filter(f => f.coveragePercent === 100).length;
                const groupPct =
                    groupFiles.length > 0
                        ? Math.round(
                              groupFiles.reduce((sum, f) => sum + f.coveragePercent, 0) /
                                  groupFiles.length
                          )
                        : 0;

                return (
                    <details open class="cdx-coverage-group" data-cdx-coverage-group={typeKey}>
                        <summary class="cdx-coverage-group-header">
                            {ChevronIcon()}
                            <span class={`cdx-badge ${meta.badge}`}>{meta.label}</span>
                            <span class="cdx-coverage-group-fraction">
                                {groupDocumented}/{groupFiles.length}
                            </span>
                        </summary>

                        <table class="cdx-coverage-table">
                            <thead>
                                <tr>
                                    <th data-cdx-sort="name" aria-sort="none">
                                        {t('identifier')}<span class="cdx-coverage-sort-arrow" aria-hidden="true"></span>
                                    </th>
                                    <th
                                        data-cdx-sort="file"
                                        aria-sort="none"
                                        class="cdx-coverage-file-col"
                                    >
                                        {t('file')}<span class="cdx-coverage-sort-arrow" aria-hidden="true"></span>
                                    </th>
                                    <th data-cdx-sort="coverage" aria-sort="ascending">
                                        {t('coverage') || 'Coverage'}<span class="cdx-coverage-sort-arrow" aria-hidden="true">{'\u25B2'}</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupFiles.map(f => (
                                    <tr
                                        data-cdx-coverage-name={f.name.toLowerCase()}
                                        data-cdx-coverage-file={f.filePath.toLowerCase()}
                                        data-cdx-coverage-pct={String(f.coveragePercent)}
                                    >
                                        <td>
                                            <a href={fileLink(f)}>{f.name}</a>
                                        </td>
                                        <td
                                            class="cdx-coverage-file cdx-coverage-file-col"
                                            title={f.filePath}
                                        >
                                            {shortPath(f.filePath)}
                                        </td>
                                        <td class="cdx-coverage-cell">
                                            <span class={`cdx-coverage-pct cdx-coverage-pct--${f.coveragePercent <= 33 ? 'low' : f.coveragePercent <= 66 ? 'medium' : 'high'}`}>
                                                {f.coveragePercent}%
                                            </span>
                                            <span style="color:var(--color-cdx-text-muted);font-size:0.75rem;margin-left:4px">
                                                ({f.coverageCount})
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </details>
                );
            })}
        </>
    ) as string;
};
