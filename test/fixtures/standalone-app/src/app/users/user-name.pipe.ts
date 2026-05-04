import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a user name for display.
 *
 * @since 1.0.0
 */
@Pipe({ name: 'userName', standalone: true, pure: true })
export class UserNamePipe implements PipeTransform {
    transform(name: string, format: 'full' | 'initials' = 'full'): string {
        if (format === 'initials') {
            return name.split(' ').map(n => n[0]).join('');
        }
        return name;
    }
}
