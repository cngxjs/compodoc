import { Component, input, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../shared/models/user.model';
import { ApiService } from '../../core/services/api.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

/**
 * User detail page with route input binding.
 *
 * Uses `input()` with route parameter binding via `withComponentInputBinding()`.
 *
 * @category Features
 * @route /users/:id
 * @since 2.0.0
 */
@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [CommonModule, TimeAgoPipe],
    template: `
        <div *ngIf="user()">
            <h2>{{ user()!.displayName ?? user()!.username }}</h2>
            <p>{{ user()!.email }}</p>
            <p>Role: {{ user()!.role }}</p>
        </div>
    `,
})
export class UserDetailComponent {
    private readonly api = inject(ApiService);

    /**
     * User ID from route parameter (bound via withComponentInputBinding).
     */
    readonly id = input.required<string>();

    /**
     * Loaded user data.
     */
    readonly user = signal<User | null>(null);

    /**
     * Display name derived from user.
     */
    readonly displayName = computed(() => this.user()?.displayName ?? this.user()?.username ?? '');

    constructor() {
        effect(() => {
            const id = this.id();
            if (id) {
                this.api.get<User>(`/users/${id}`).subscribe((u) => this.user.set(u));
            }
        });
    }
}
