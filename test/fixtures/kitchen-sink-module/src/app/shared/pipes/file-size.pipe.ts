import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a byte count to a human-readable file size.
 *
 * @example
 * ```html
 * {{ 1536 | fileSize }}
 * <!-- Output: "1.50 KB" -->
 *
 * {{ 1048576 | fileSize:'MB' }}
 * <!-- Output: "1.00 MB" -->
 * ```
 *
 * @since 1.2.0
 * @beta
 */
@Pipe({
    name: 'fileSize',
    pure: true,
})
export class FileSizePipe implements PipeTransform {
    /**
     * Transform a byte count to formatted file size.
     *
     * @param bytes - Number of bytes
     * @param unit - Force a specific unit (KB, MB, GB)
     * @param decimals - Number of decimal places (default 2)
     * @returns Formatted file size string
     */
    transform(bytes: number, unit?: 'KB' | 'MB' | 'GB', decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';

        const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        let idx: number;

        if (unit) {
            idx = units.indexOf(unit);
            return (bytes / Math.pow(1024, idx)).toFixed(decimals) + ' ' + unit;
        }

        idx = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, idx)).toFixed(decimals) + ' ' + units[idx];
    }
}
