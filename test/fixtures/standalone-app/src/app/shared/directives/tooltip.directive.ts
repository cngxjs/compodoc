import { Directive, input } from '@angular/core';

/**
 * Shows a tooltip on hover with the provided text.
 *
 * @since 1.1.0
 */
@Directive({
    selector: '[appTooltip]',
    standalone: true,
    host: { '[attr.title]': 'appTooltip()' },
})
export class TooltipDirective {
    readonly appTooltip = input.required<string>();
}
