import { Component } from '@angular/core';

/**
 * Shows recent activity feed items.
 *
 * @since 1.1.0
 */
@Component({
    selector: 'app-activity-feed',
    standalone: true,
    template: `<ul class="activity-feed"><li>No recent activity</li></ul>`,
})
export class ActivityFeedComponent {}
