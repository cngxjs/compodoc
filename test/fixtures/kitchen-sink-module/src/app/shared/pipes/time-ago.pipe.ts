import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts a Date to a human-readable "time ago" string.
 *
 * This is an impure pipe that updates on every change detection cycle.
 *
 * @example
 * ```html
 * {{ createdAt | timeAgo }}
 * <!-- Output: "3 hours ago" -->
 * ```
 *
 * @since 1.1.0
 */
@Pipe({
    name: 'timeAgo',
    pure: false,
})
export class TimeAgoPipe implements PipeTransform {
    /**
     * Transform a date into a relative time string.
     *
     * @param value - The date to transform (Date, string, or number)
     * @returns Human-readable relative time string
     */
    transform(value: Date | string | number | null): string {
        if (!value) return '';

        const date = new Date(value);
        const now = Date.now();
        const seconds = Math.floor((now - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
        return `${Math.floor(seconds / 2592000)} months ago`;
    }
}
