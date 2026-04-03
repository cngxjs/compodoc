import { Directive, ElementRef, AfterViewInit } from '@angular/core';

/**
 * Automatically focuses the host element on initialization.
 *
 * @since 1.2.0
 * @zoneless
 * @group UI Directives
 * @order 1
 *
 * @example
 * ```html
 * <input appAutoFocus />
 * ```
 */
@Directive({
    selector: '[appAutoFocus]',
    standalone: true,
})
export class AutoFocusDirective implements AfterViewInit {
    constructor(private el: ElementRef<HTMLElement>) {}

    ngAfterViewInit(): void {
        this.el.nativeElement.focus();
    }
}
