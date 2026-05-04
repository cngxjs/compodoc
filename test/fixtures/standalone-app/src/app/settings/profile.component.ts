import { Component, input } from '@angular/core';

/**
 * User profile editing form.
 *
 * @since 1.1.0
 * @route /settings/profile
 */
@Component({
    selector: 'app-profile',
    standalone: true,
    template: `<h3>Profile</h3><p>Edit your profile here.</p>`,
})
export class ProfileComponent {
    readonly userId = input<number>();
}
