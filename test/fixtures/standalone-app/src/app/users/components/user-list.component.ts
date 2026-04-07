import { Component, inject, OnInit } from '@angular/core';
import { UserCardComponent } from './user-card.component';
import { UserService, User } from '../user.service';

/**
 * Displays a list of users.
 *
 * @since 1.0.0
 * @zoneless
 * @route /users
 *
 * @example
 * ```html
 * <app-user-list></app-user-list>
 * ```
 */
@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [UserCardComponent],
    template: `
        <div class="user-list">
            <app-user-card *ngFor="let user of users" [user]="user"></app-user-card>
        </div>
    `,
})
export class UserListComponent implements OnInit {
    private readonly userService = inject(UserService);
    users: User[] = [];

    async ngOnInit(): Promise<void> {
        this.users = await this.userService.getUsers();
    }
}
