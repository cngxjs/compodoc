import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncates a string to a specified length with an ellipsis.
 *
 * @example
 * ```html
 * {{ 'Long text here' | truncate:10 }}
 * <!-- Output: Long text... -->
 *
 * {{ longText | truncate:50:'---' }}
 * <!-- Output: Long text here with custom suffix--- -->
 * ```
 *
 * @since 1.0.0
 */
@Pipe({
    name: 'truncate',
    pure: true,
})
export class TruncatePipe implements PipeTransform {
    /**
     * Truncate the input string.
     *
     * @param value - The input string
     * @param limit - Maximum character count (default 100)
     * @param trail - The trailing string (default '...')
     * @returns The truncated string
     */
    transform(value: string, limit: number = 100, trail: string = '...'): string {
        if (!value) return '';
        return value.length > limit ? value.substring(0, limit) + trail : value;
    }
}
