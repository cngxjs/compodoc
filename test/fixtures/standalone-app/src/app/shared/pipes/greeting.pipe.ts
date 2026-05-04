import { Pipe, PipeTransform } from '@angular/core';

/**
 * Adds a greeting prefix to a name.
 *
 * @since 1.0.0
 *
 * @example
 * ```html
 * {{ 'Alice' | greeting }}
 * ```
 */
@Pipe({ name: 'greeting', standalone: true, pure: true })
export class GreetingPipe implements PipeTransform {
    transform(value: string): string {
        return `Hello, ${value}!`;
    }
}
