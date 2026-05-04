import { Directive, ElementRef, inject, afterNextRender } from '@angular/core';

/**
 * Automatically focuses the host element after render.
 *
 * @since 1.2.0
 */
@Directive({
    selector: '[appAutofocus]',
    standalone: true,
})
export class AutofocusDirective {
    private readonly el = inject(ElementRef<HTMLElement>);

    constructor() {
        afterNextRender(() => this.el.nativeElement.focus());
    }
}
