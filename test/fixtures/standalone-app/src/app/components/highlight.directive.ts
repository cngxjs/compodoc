import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Highlights the host element on hover.
 *
 * @since 1.0.0
 * @zoneless
 * @group UI Directives
 *
 * @example
 * ```html
 * <div appHighlight>Hover me</div>
 * ```
 */
@Directive({
    selector: '[appHighlight]',
    standalone: true,
})
export class HighlightDirective {
    constructor(private el: ElementRef<HTMLElement>) {}

    /**
     * Apply highlight on mouse enter.
     * @group Event Handlers
     */
    @HostListener('mouseenter')
    onMouseEnter(): void {
        this.el.nativeElement.style.backgroundColor = '#f0f0f0';
    }

    /**
     * Remove highlight on mouse leave.
     * @group Event Handlers
     */
    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.el.nativeElement.style.backgroundColor = '';
    }
}
