import { Directive, ElementRef, Input, AfterViewInit } from '@angular/core';

/**
 * Directive that auto-focuses the host element after view init.
 *
 * @example
 * ```html
 * <input appAutofocus />
 * <input [appAutofocus]="shouldFocus" />
 * ```
 *
 * @since 1.0.0
 */
@Directive({
    selector: '[appAutofocus]',
})
export class AutofocusDirective implements AfterViewInit {
    /**
     * Whether auto-focus is enabled. Defaults to true.
     */
    @Input('appAutofocus') enabled: boolean | '' = '';

    constructor(private el: ElementRef<HTMLElement>) {}

    /** @ignore */
    ngAfterViewInit(): void {
        if (this.enabled !== false) {
            this.el.nativeElement.focus();
        }
    }
}
