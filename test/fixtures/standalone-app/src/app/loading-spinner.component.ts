import { Component, input } from '@angular/core';

/**
 * Global loading spinner overlay.
 *
 * @since 1.0.0
 */
@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    template: `<div class="spinner" [class.active]="active()">Loading...</div>`,
})
export class LoadingSpinnerComponent {
    /** Whether the spinner is visible. */
    readonly active = input(false);
}
