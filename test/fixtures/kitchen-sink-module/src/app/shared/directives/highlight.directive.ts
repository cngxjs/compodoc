import { Directive, ElementRef, HostBinding, HostListener, Input, OnInit, OnDestroy } from '@angular/core';

/**
 * Directive that highlights elements on hover with a configurable color.
 *
 * @example
 * ```html
 * <p appHighlight [highlightColor]="'yellow'" [hoverColor]="'gold'">
 *   Hover me!
 * </p>
 * ```
 *
 * @since 1.0.0
 */
@Directive({
    selector: '[appHighlight]',
})
export class HighlightDirective implements OnInit, OnDestroy {
    /**
     * The default background color.
     */
    @Input() highlightColor: string = 'transparent';

    /**
     * The background color on hover.
     */
    @Input() hoverColor: string = '#ffffcc';

    /**
     * Whether highlighting is enabled.
     */
    @Input() highlightEnabled: boolean = true;

    /**
     * Current background color bound to the host.
     */
    @HostBinding('style.backgroundColor') backgroundColor: string = '';

    /**
     * Add a CSS transition to the host.
     */
    @HostBinding('style.transition') transition = 'background-color 0.2s';

    constructor(private el: ElementRef) {}

    /** @ignore */
    ngOnInit(): void {
        this.backgroundColor = this.highlightColor;
    }

    /** @ignore */
    ngOnDestroy(): void {
        this.backgroundColor = '';
    }

    /**
     * Apply hover color on mouse enter.
     */
    @HostListener('mouseenter')
    onMouseEnter(): void {
        if (this.highlightEnabled) {
            this.backgroundColor = this.hoverColor;
        }
    }

    /**
     * Restore default color on mouse leave.
     */
    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.backgroundColor = this.highlightColor;
    }
}
