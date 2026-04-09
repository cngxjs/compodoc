import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { User } from '../../core/models/user.model';
import { UserService } from './user.service';

/**
 * Displays a list of all users.
 *
 * @category Features
 * @route /users
 */
@Component({
    selector: 'app-user-list',
    template: `
        <h1>Users</h1>
        <app-generic-table [columns]="columns" [data]="users" (rowClicked)="onRowClick($event)">
        </app-generic-table>
    `,
})
export class UserListComponent implements OnInit {
    /**
     * List of users to display.
     */
    users: User[] = [];

    /**
     * Table column definitions.
     */
    columns = [
        { key: 'username', header: 'Username', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'role', header: 'Role', sortable: true },
    ];

    constructor(private userService: UserService) {}

    /** @ignore */
    ngOnInit(): void {
        this.userService.getUsers().subscribe((users) => (this.users = users));
    }

    /**
     * Handle row click to navigate to user detail.
     */
    onRowClick(user: User): void {
        console.log('Selected:', user);
    }
}
