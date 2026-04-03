import { Pipe, PipeTransform } from '@angular/core';

/**
 * Adds a greeting prefix to a name.
 *
 * @since 1.0.0
 * @group Display Pipes
 *
 * @example
 * ```html
 * {{ 'Alice' | greeting }}
 * <!-- Output: "Hello, Alice!" -->
 * ```
 */
@Pipe({
    name: 'greeting',
    standalone: true,
    pure: true,
})
export class GreetingPipe implements PipeTransform {
    /**
     * Transform a name into a greeting.
     * @since 1.0.0
     */
    transform(value: string): string {
        return `Hello, ${value}!`;
    }
}
