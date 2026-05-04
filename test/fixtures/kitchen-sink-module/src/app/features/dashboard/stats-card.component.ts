import { Component, Input } from '@angular/core';
import { TodoStats } from '../../core/models/todo.model';

/**
 * Displays todo statistics in a card layout.
 *
 * @example
 * ```html
 * <app-stats-card [stats]="todoStats"></app-stats-card>
 * ```
 *
 * @category Features
 */
@Component({
    selector: 'app-stats-card',
    template: `
        <div class="stats-card">
            <div>Total: {{ stats?.total }}</div>
            <div>Completed: {{ stats?.completed }}</div>
            <div>Remaining: {{ stats?.remaining }}</div>
        </div>
    `,
})
export class StatsCardComponent {
    /**
     * The statistics data to display.
     */
    @Input() stats?: TodoStats;
}
