type CoverageFile = {
    readonly status: string;
    readonly coveragePercent: number;
    [key: string]: unknown;
};

export type CoverageStats = {
    readonly total: number;
    readonly documented: number;
    readonly partial: number;
    readonly undocumented: number;
    readonly percent: number;
};

export function computeCoverageStats(files: CoverageFile[]): CoverageStats {
    if (!files || files.length === 0) {
        return { total: 0, documented: 0, partial: 0, undocumented: 0, percent: 0 };
    }

    let documented = 0;
    let partial = 0;
    let undocumented = 0;

    for (const f of files) {
        if (f.coveragePercent === 100) {
            documented++;
        } else if (f.coveragePercent > 0) {
            partial++;
        } else {
            undocumented++;
        }
    }

    const total = files.length;
    const percent = Math.floor(files.reduce((sum, f) => sum + f.coveragePercent, 0) / total);

    return { total, documented, partial, undocumented, percent };
}
