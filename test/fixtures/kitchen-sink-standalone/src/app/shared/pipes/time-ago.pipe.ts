import { Pipe, PipeTransform } from '@angular/core';

/**
 * Standalone impure pipe that converts dates to relative time strings.
 *
 * @example
 * ```html
 * {{ someDate | timeAgo }}
 * ```
 *
 * @since 2.0.0
 */
@Pipe({
    name: 'timeAgo',
    standalone: true,
    pure: false,
})
export class TimeAgoPipe implements PipeTransform {
    /**
     * Transform a date to relative time.
     *
     * @param value - The date
     * @returns Relative time string
     */
    transform(value: Date | string | number | null): string {
        if (!value) return '';
        const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
}
