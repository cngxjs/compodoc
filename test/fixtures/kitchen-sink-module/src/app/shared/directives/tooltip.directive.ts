import {
    Directive,
    ElementRef,
    HostListener,
    Input,
    OnDestroy,
    Renderer2,
} from '@angular/core';

/**
 * Tooltip position options.
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Directive that shows a tooltip on hover.
 *
 * @example
 * ```html
 * <button appTooltip="Click to save" [tooltipPosition]="'bottom'">Save</button>
 * ```
 *
 * @since 1.0.0
 */
@Directive({
    selector: '[appTooltip]',
    exportAs: 'tooltip',
})
export class TooltipDirective implements OnDestroy {
    /**
     * The tooltip text to display.
     */
    @Input('appTooltip') text: string = '';

    /**
     * Tooltip position relative to the host.
     */
    @Input() tooltipPosition: TooltipPosition = 'top';

    /**
     * Delay before showing the tooltip (ms).
     */
    @Input() tooltipDelay: number = 300;

    /**
     * Whether the tooltip is currently visible.
     */
    get isVisible(): boolean {
        return this.tooltipEl !== null;
    }

    private tooltipEl: HTMLElement | null = null;
    private timeoutId: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private el: ElementRef,
        private renderer: Renderer2
    ) {}

    /**
     * Show tooltip on mouse enter.
     */
    @HostListener('mouseenter')
    onMouseEnter(): void {
        this.timeoutId = setTimeout(() => this.show(), this.tooltipDelay);
    }

    /**
     * Hide tooltip on mouse leave.
     */
    @HostListener('mouseleave')
    onMouseLeave(): void {
        this.hide();
    }

    /**
     * Programmatically show the tooltip.
     */
    show(): void {
        if (this.tooltipEl || !this.text) return;
        this.tooltipEl = this.renderer.createElement('div');
        this.renderer.appendChild(
            this.tooltipEl!,
            this.renderer.createText(this.text)
        );
        this.renderer.appendChild(document.body, this.tooltipEl);
    }

    /**
     * Programmatically hide the tooltip.
     */
    hide(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        if (this.tooltipEl) {
            this.renderer.removeChild(document.body, this.tooltipEl);
            this.tooltipEl = null;
        }
    }

    /** @ignore */
    ngOnDestroy(): void {
        this.hide();
    }
}
