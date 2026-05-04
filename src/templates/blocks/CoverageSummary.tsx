import Html from '@kitajs/html';
export type CoverageStat = {
    readonly value: string | number;
    readonly label: string;
    readonly modifier?: string;
    readonly subtitle?: string;
};

export type CoverageSummaryProps = {
    readonly donutHtml: string;
    readonly stats: CoverageStat[];
};

export const CoverageSummary = (props: CoverageSummaryProps): string =>
    (
        <div class="cdx-coverage-summary">
            {props.donutHtml}
            <div class="cdx-coverage-stats">
                {props.stats.map(stat => (
                    <div>
                        <div
                            class={`cdx-coverage-stat-value${stat.modifier ? ` cdx-coverage-stat-value--${stat.modifier}` : ''}`}
                        >
                            {stat.value}
                        </div>
                        <div class="cdx-coverage-stat-label">{stat.label}</div>
                        {stat.subtitle && <div class="cdx-coverage-stat-sub">{stat.subtitle}</div>}
                    </div>
                ))}
            </div>
        </div>
    ) as string;
