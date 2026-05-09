import { Component, signal } from '@angular/core';
import { LoadingSpinnerComponent } from '../loading-spinner.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [LoadingSpinnerComponent],
    template: `
        <button type="button" (click)="active.update(v => !v)">
            {{ active() ? 'Stop' : 'Start' }} loading
        </button>
        <app-loading-spinner [active]="active()"></app-loading-spinner>
    `
})
export class SpinnerTogglePlayground {
    readonly active = signal(false);
}
