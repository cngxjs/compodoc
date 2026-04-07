import { Component, input } from '@angular/core';

/**
 * Generic error boundary that catches rendering errors.
 *
 * @since 1.1.0
 */
@Component({
    selector: 'app-error-boundary',
    standalone: true,
    template: `<div class="error" *ngIf="message()">{{ message() }}</div>`,
})
export class ErrorBoundaryComponent {
    /** Error message to display. */
    readonly message = input<string>();
}
