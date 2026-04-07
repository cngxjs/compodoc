import { Component, input, output } from '@angular/core';

/**
 * Reusable confirmation dialog.
 *
 * @since 1.0.0
 */
@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    template: `
        <dialog>
            <p>{{ message() }}</p>
            <button (click)="confirmed.emit(true)">OK</button>
            <button (click)="confirmed.emit(false)">Cancel</button>
        </dialog>
    `,
})
export class ConfirmDialogComponent {
    readonly message = input.required<string>();
    readonly confirmed = output<boolean>();
}
