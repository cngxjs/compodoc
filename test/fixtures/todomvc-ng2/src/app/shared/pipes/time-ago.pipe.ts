import { Pipe, PipeTransform } from '@angular/core';

/**
 * Transforms a date into a human-readable "time ago" string.
 *
 * @since 2.0.0
 * @beta
 * @group Display Pipes
 *
 * @example
 * ```html
 * {{ createdAt | timeAgo }}
 * <!-- Output: "3 minutes ago" -->
 * ```
 */
@Pipe({
    name: 'timeAgo',
    standalone: true,
    pure: true,
})
export class TimeAgoPipe implements PipeTransform {
    /**
     * Transform a Date or timestamp into a relative time string.
     * @since 2.0.0
     */
    transform(value: Date | number | string): string {
        const date = new Date(value);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds} seconds ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return `${Math.floor(seconds / 86400)} days ago`;
    }
}
