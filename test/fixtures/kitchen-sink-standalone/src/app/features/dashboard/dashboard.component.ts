import { Component, inject, signal, computed, effect, resource, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoStore } from '../../core/services/todo.store';
import { SignalCardComponent } from '../../shared/components/signal-card.component';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';

/**
 * Dashboard page using signals, resource(), and linkedSignal().
 *
 * @example
 * ```html
 * <app-dashboard />
 * ```
 *
 * @category Features
 * @route /dashboard
 * @since 2.0.0
 */
@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, SignalCardComponent, TruncatePipe],
    template: `
        <h1>Dashboard</h1>
        <p>Total: {{ store.count() }}, Completed: {{ store.completedCount() }}</p>
        <p>Progress: {{ store.completionPercent() }}%</p>
        <app-signal-card
            [title]="'Recent Todos'"
            [(expanded)]="cardExpanded"
            [selectedIndex]="selectedIdx">
            <ul>
                <li *ngFor="let todo of recentTodos()">
                    {{ todo.title | truncate:30 }}
                </li>
            </ul>
        </app-signal-card>
    `,
})
export class DashboardComponent {
    readonly store = inject(TodoStore);

    /**
     * Card expansion state.
     */
    readonly cardExpanded = signal(true);

    /**
     * Selected card index.
     */
    readonly selectedIdx = signal(0);

    /**
     * The 5 most recent todos.
     */
    readonly recentTodos = computed(() => this.store.todos().slice(-5));

    /**
     * A refresh counter for triggering resource reloads.
     */
    readonly refreshCount = signal(0);

    /**
     * Linked signal that resets when refresh count changes.
     */
    readonly lastRefresh = linkedSignal(() => {
        this.refreshCount();
        return new Date();
    });

    constructor() {
        effect(() => {
            console.log('Dashboard stats:', this.store.stats());
        });
    }

    /**
     * Trigger a dashboard data refresh.
     */
    refresh(): void {
        this.refreshCount.update((c) => c + 1);
    }
}
