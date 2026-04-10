import { Directive, ElementRef, HostBinding, HostListener, input, effect, inject } from '@angular/core';

/**
 * Standalone highlight directive using signal inputs.
 *
 * @example
 * ```html
 * <p appHighlight [color]="'yellow'" [hoverColor]="'gold'">Hover me</p>
 * ```
 *
 * @since 2.0.0
 * @storybook https://storybook.example.com/?path=/story/directives-highlight--default
 * @github https://github.com/cngxjs/compodocx/blob/develop/test/fixtures/kitchen-sink-standalone/src/app/shared/directives/highlight.directive.ts
 * @docs https://cngx.dev/directives/highlight
 */
@Directive({
    selector: '[appHighlight]',
    standalone: true,
})
export class HighlightDirective {
    private readonly el = inject(ElementRef);

    /**
     * Default background color.
     */
    readonly color = input('transparent');

    /**
     * Hover background color.
     */
    readonly hoverColor = input('#ffffcc');

    /**
     * Whether highlighting is enabled.
     */
    readonly enabled = input(true);

    /**
     * Current background color.
     */
    @HostBinding('style.backgroundColor') bgColor = 'transparent';

    /**
     * CSS transition.
     */
    @HostBinding('style.transition') transition = 'background-color 0.2s';

    constructor() {
        effect(() => {
            this.bgColor = this.color();
        });
    }

    /**
     * Apply hover color.
     */
    @HostListener('mouseenter')
    onEnter(): void {
        if (this.enabled()) this.bgColor = this.hoverColor();
    }

    /**
     * Restore default color.
     */
    @HostListener('mouseleave')
    onLeave(): void {
        this.bgColor = this.color();
    }
}
