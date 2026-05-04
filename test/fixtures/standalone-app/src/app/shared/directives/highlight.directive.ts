import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Highlights the host element on hover.
 *
 * @since 1.0.0
 * @zoneless
 *
 * @example
 * ```html
 * <div appHighlight>Hover me</div>
 * ```
 */
@Directive({
    selector: '[appHighlight]',
    standalone: true,
    host: {
        '(mouseenter)': 'onMouseEnter()',
        '(mouseleave)': 'onMouseLeave()',
        '[class.highlighted]': 'isHighlighted',
    },
})
export class HighlightDirective {
    private readonly el = inject(ElementRef<HTMLElement>);
    isHighlighted = false;

    onMouseEnter(): void {
        this.isHighlighted = true;
        this.el.nativeElement.style.backgroundColor = '#f0f0f0';
    }

    onMouseLeave(): void {
        this.isHighlighted = false;
        this.el.nativeElement.style.backgroundColor = '';
    }
}
