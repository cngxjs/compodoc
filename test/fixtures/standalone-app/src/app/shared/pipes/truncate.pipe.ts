import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncates a string to the given length with an ellipsis.
 *
 * @since 1.1.0
 */
@Pipe({ name: 'truncate', standalone: true, pure: true })
export class TruncatePipe implements PipeTransform {
    transform(value: string, limit = 50): string {
        return value.length > limit ? value.slice(0, limit) + '...' : value;
    }
}
