import { Component, inject, input } from '@angular/core';
import { UserService, User } from '../user.service';

/**
 * Shows full detail view for a single user.
 *
 * @since 1.1.0
 * @route /users/:id
 */
@Component({
    selector: 'app-user-detail',
    standalone: true,
    template: `<h2>User Detail: {{ userId() }}</h2>`,
})
export class UserDetailComponent {
    private readonly userService = inject(UserService);
    readonly userId = input.required<number>();
}
