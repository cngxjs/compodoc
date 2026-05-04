import { Pipe, PipeTransform } from '@angular/core';

/**
 * Standalone pipe that truncates text.
 *
 * @example
 * ```html
 * {{ 'Long text' | truncate:5 }}
 * <!-- Output: Long ... -->
 * ```
 *
 * @since 2.0.0
 */
@Pipe({
    name: 'truncate',
    standalone: true,
    pure: true,
})
export class TruncatePipe implements PipeTransform {
    /**
     * Truncate the string.
     *
     * @param value - Input text
     * @param limit - Max length
     * @param trail - Suffix
     */
    transform(value: string, limit: number = 100, trail: string = '...'): string {
        if (!value) return '';
        return value.length > limit ? value.substring(0, limit) + trail : value;
    }
}
