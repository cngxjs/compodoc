import { Component } from '@angular/core';

/**
 * Notification preferences page.
 *
 * @since 1.2.0
 * @route /settings/notifications
 */
@Component({
    selector: 'app-notifications',
    standalone: true,
    template: `<h3>Notifications</h3><p>Manage your notification preferences.</p>`,
})
export class NotificationsComponent {}
