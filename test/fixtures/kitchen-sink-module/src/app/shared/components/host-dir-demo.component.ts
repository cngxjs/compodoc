import { Component, Input, ViewEncapsulation } from '@angular/core';
import { HighlightDirective } from '../directives/highlight.directive';
import { TooltipDirective } from '../directives/tooltip.directive';

/**
 * Component demonstrating `hostDirectives` composition.
 *
 * Composes `HighlightDirective` and `TooltipDirective` directly on the host,
 * exposing selected inputs to consumers.
 *
 * @example
 * ```html
 * <app-host-dir-demo
 *   [highlightColor]="'#ffe'"
 *   [appTooltip]="'Hello'">
 *   Content here
 * </app-host-dir-demo>
 * ```
 *
 * @since 1.3.0
 */
@Component({
    selector: 'app-host-dir-demo',
    template: `<div class="host-dir-demo"><ng-content></ng-content></div>`,
    encapsulation: ViewEncapsulation.None,
    hostDirectives: [
        {
            directive: HighlightDirective,
            inputs: ['highlightColor', 'hoverColor'],
        },
        {
            directive: TooltipDirective,
            inputs: ['appTooltip: appTooltip', 'tooltipPosition'],
        },
    ],
})
export class HostDirDemoComponent {
    /**
     * Additional custom label.
     */
    @Input() label: string = '';
}
