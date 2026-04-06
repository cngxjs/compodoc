import { Component, inject } from '@angular/core';
import { API_BASE_URL } from '../../core/tokens/api.token';

/**
 * Settings page component.
 *
 * @since 1.1.0
 * @route /settings
 */
@Component({
    selector: 'app-settings',
    standalone: true,
    template: `<h2>Settings</h2><p>API: {{ apiUrl }}</p>`,
})
export class SettingsComponent {
    readonly apiUrl = inject(API_BASE_URL);
}
