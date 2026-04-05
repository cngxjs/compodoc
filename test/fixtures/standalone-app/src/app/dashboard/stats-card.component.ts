import { Component, input } from '@angular/core';

/**
 * Displays a single statistic in a card layout.
 *
 * @since 1.0.0
 */
@Component({
    selector: 'app-stats-card',
    standalone: true,
    template: `<div class="stats-card"><h4>{{ label() }}</h4><span>{{ value() }}</span></div>`,
})
export class StatsCardComponent {
    readonly label = input.required<string>();
    readonly value = input.required<number>();
}
