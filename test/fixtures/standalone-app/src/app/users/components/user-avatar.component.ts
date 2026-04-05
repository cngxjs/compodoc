import { Component, input } from '@angular/core';

/**
 * Displays a user avatar with initials fallback.
 *
 * @since 1.0.0
 */
@Component({
    selector: 'app-user-avatar',
    standalone: true,
    template: `<div class="avatar">{{ initials() }}</div>`,
})
export class UserAvatarComponent {
    readonly name = input.required<string>();
    readonly initials = () => this.name().split(' ').map(n => n[0]).join('');
}
