import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../core/models/user.model';
import { UserService } from './user.service';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';

/**
 * Displays and edits a single user's details.
 *
 * Implements {@link HasUnsavedChanges} for the route guard.
 *
 * @category Features
 * @route /users/:id
 */
@Component({
    selector: 'app-user-detail',
    template: `
        <div *ngIf="user">
            <h1>{{ user.displayName || user.username }}</h1>
            <p>{{ user.email }}</p>
        </div>
    `,
})
export class UserDetailComponent implements OnInit, HasUnsavedChanges {
    /**
     * The loaded user data.
     */
    user?: User;

    /**
     * Whether the form has been modified.
     */
    dirty = false;

    constructor(
        private route: ActivatedRoute,
        private userService: UserService
    ) {}

    /** @ignore */
    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.userService.getUserById(id).subscribe((u) => (this.user = u));
    }

    /**
     * Check for unsaved changes (guard interface).
     */
    hasUnsavedChanges(): boolean {
        return this.dirty;
    }
}
