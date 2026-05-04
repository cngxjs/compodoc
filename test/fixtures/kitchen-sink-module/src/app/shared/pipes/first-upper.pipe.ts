import { Pipe, PipeTransform } from '@angular/core';

/**
 * Capitalizes the first letter of a string.
 *
 * @example
 * ```html
 * {{ 'hello world' | firstUpper }}
 * <!-- Output: Hello world -->
 * ```
 *
 * @since 1.0.0
 */
@Pipe({
    name: 'firstUpper',
    pure: true,
})
export class FirstUpperPipe implements PipeTransform {
    /**
     * Transform the input string.
     *
     * @param value - The input string
     * @returns The string with its first character uppercased
     */
    transform(value: string): string {
        if (!value) return '';
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
}
