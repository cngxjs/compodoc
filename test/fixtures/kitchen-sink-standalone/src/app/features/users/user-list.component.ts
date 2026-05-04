import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataTableComponent, Column } from '../../shared/components/data-table.component';
import { User } from '../../shared/models/user.model';
import { ApiService } from '../../core/services/api.service';

/**
 * User list page with signal-based data table.
 *
 * @category Features
 * @route /users
 * @since 2.0.0
 */
@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, RouterModule, DataTableComponent],
    template: `
        <h1>Users ({{ userCount() }})</h1>
        <app-data-table
            [columns]="columns"
            [rows]="users()"
            [loading]="loading()"
            (rowClicked)="onSelect($event)" />
        <router-outlet />
    `,
})
export class UserListComponent {
    private readonly api = inject(ApiService);

    /**
     * Current user list.
     */
    readonly users = signal<User[]>([]);

    /**
     * Loading state.
     */
    readonly loading = signal(true);

    /**
     * Total user count.
     */
    readonly userCount = computed(() => this.users().length);

    /**
     * Column definitions for the user table.
     */
    readonly columns: Column<User>[] = [
        { key: 'username', header: 'Username', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'role', header: 'Role', sortable: true },
    ];

    constructor() {
        this.api.get<User[]>('/users').subscribe({
            next: (users) => {
                this.users.set(users);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    /**
     * Handle user row selection.
     */
    onSelect(user: User): void {
        console.log('Selected user:', user.username);
    }
}
