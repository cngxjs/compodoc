import { Component, OnInit } from '@angular/core';
import { TodoStore } from '../../core/services/todo.store';
import { TodoStats } from '../../core/models/todo.model';

/**
 * Dashboard page showing an overview of todos and stats.
 *
 * @category Features
 * @route /dashboard
 */
@Component({
    selector: 'app-dashboard',
    template: `
        <h1>Dashboard</h1>
        <app-stats-card [stats]="stats"></app-stats-card>
        <app-todo-list [todos]="store.getAll()" [limit]="5"></app-todo-list>
    `,
})
export class DashboardComponent implements OnInit {
    /**
     * Current todo statistics.
     */
    stats!: TodoStats;

    constructor(public store: TodoStore) {}

    /** @ignore */
    ngOnInit(): void {
        this.stats = this.store.getStats();
    }
}
