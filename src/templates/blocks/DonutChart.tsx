import Html from '@kitajs/html';

const COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };

type DonutSize = 'sm' | 'lg';

const SIZE_CONFIG: Record<DonutSize, { viewBox: number; radius: number; strokeWidth: number; cssClass: string; pctClass: string }> = {
    sm: { viewBox: 80, radius: 34, strokeWidth: 7, cssClass: 'cdx-overview-donut', pctClass: 'cdx-overview-donut-pct' },
    lg: { viewBox: 120, radius: 50, strokeWidth: 10, cssClass: 'cdx-coverage-donut', pctClass: 'cdx-coverage-donut-pct' },
};

type DonutChartProps = {
    readonly percent: number;
    readonly documented: number;
    readonly partial: number;
    readonly undocumented: number;
    readonly total: number;
    readonly size?: DonutSize;
};

/**
 * Shared SVG donut chart for documentation coverage.
 *
 * - `size: 'sm'` (80x80) for overview page KPI row
 * - `size: 'lg'` (120x120) for coverage report page
 *
 * Segments animate on viewport entry via CSS transition + IntersectionObserver
 * in the client bundle. Initial render uses stroke-dasharray="0 circumference"
 * with data-cdx-target attributes holding the final values.
 */
export function DonutChart({ percent, documented, partial, undocumented, total, size = 'lg' }: DonutChartProps): string {
    const cfg = SIZE_CONFIG[size];
    const cx = cfg.viewBox / 2;
    const circumference = 2 * Math.PI * cfg.radius;

    const docFrac = total > 0 ? documented / total : 0;
    const partFrac = total > 0 ? partial / total : 0;

    const docLen = circumference * docFrac;
    const partLen = circumference * partFrac;
    const undocLen = circumference - docLen - partLen;

    const docOffset = 0;
    const partOffset = -(docLen);
    const undocOffset = -(docLen + partLen);

    const segment = (len: number, offset: number, color: string, label: string): string => {
        if (len <= 0) return '';
        return (
            <circle cx={String(cx)} cy={String(cx)} r={String(cfg.radius)} fill="none"
                stroke={color} stroke-width={String(cfg.strokeWidth)}
                style={`stroke-dasharray:0 ${circumference};stroke-dashoffset:0`}
                data-cdx-dasharray={`${len} ${circumference - len}`}
                data-cdx-dashoffset={String(offset)}
                transform={`rotate(-90 ${cx} ${cx})`}
                class="cdx-donut-segment">
                <title>{label}</title>
            </circle>
        ) as string;
    };

    return (
        <svg viewBox={`0 0 ${cfg.viewBox} ${cfg.viewBox}`} class={cfg.cssClass} role="img"
            aria-label={`Documentation coverage: ${percent}%`}
            data-cdx-donut>
            <title>{`Documentation coverage: ${percent}%`}</title>
            {size === 'lg' && <desc>{`${documented} documented, ${partial} partial, ${undocumented} undocumented of ${total} entities`}</desc>}
            <circle cx={String(cx)} cy={String(cx)} r={String(cfg.radius)} fill="none"
                stroke="var(--color-cdx-border)" stroke-width={String(cfg.strokeWidth)}
                class={size === 'lg' ? 'cdx-coverage-donut-ring' : ''} />
            {segment(docLen, docOffset, COLORS.green, `Documented: ${documented}${size === 'lg' ? ` (${Math.round(docFrac * 100)}%)` : ''}`)}
            {segment(partLen, partOffset, COLORS.yellow, `Partial: ${partial}${size === 'lg' ? ` (${Math.round(partFrac * 100)}%)` : ''}`)}
            {segment(undocLen, undocOffset, COLORS.red, `Undocumented: ${undocumented}${size === 'lg' ? ` (${Math.round((total > 0 ? undocumented / total : 0) * 100)}%)` : ''}`)}
            <text x={String(cx)} y={String(cx)} text-anchor="middle" dominant-baseline="central"
                class={cfg.pctClass}>{percent}%</text>
        </svg>
    ) as string;
}
