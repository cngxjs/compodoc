import { Component } from '@angular/core';

/**
 * Main dashboard view with overview statistics.
 *
 * @since 1.0.0
 * @route /dashboard
 */
@Component({
    selector: 'app-dashboard',
    standalone: true,
    template: `<h2>Dashboard</h2><p>Welcome back!</p>`,
})
export class DashboardComponent {}
