import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Bypasses Angular's built-in sanitization for trusted HTML.
 *
 * **Warning:** Only use with trusted content to avoid XSS vulnerabilities.
 *
 * @example
 * ```html
 * <div [innerHTML]="richContent | safeHtml"></div>
 * ```
 *
 * @deprecated Consider using Angular's built-in sanitization instead.
 * @since 1.0.0
 */
@Pipe({
    name: 'safeHtml',
    pure: true,
})
export class SafeHtmlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    /**
     * Mark HTML as trusted.
     *
     * @param value - The raw HTML string
     * @returns Sanitizer-bypassed HTML
     */
    transform(value: string): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(value);
    }
}
