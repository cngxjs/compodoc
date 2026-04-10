import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BaseCardComponent } from './base-card.component';

/**
 * A detail card extending the base card with expandable content.
 *
 * Demonstrates single-level inheritance.
 *
 * @example
 * ```html
 * <app-detail-card
 *   title="User Details"
 *   [expanded]="true"
 *   (toggled)="onToggle($event)">
 *   <p>Card content here</p>
 * </app-detail-card>
 * ```
 */
@Component({
    selector: 'app-detail-card',
    template: `
        <div class="card">
            <div class="card-header" (click)="toggle()">{{ getFormattedTitle() }}</div>
            <div *ngIf="expanded" class="card-body"><ng-content></ng-content></div>
        </div>
    `,
})
export class DetailCardComponent extends BaseCardComponent {
    /**
     * Whether the card body is expanded.
     */
    @Input() expanded: boolean = false;

    /**
     * Emitted when the card is toggled.
     */
    @Output() toggled = new EventEmitter<boolean>();

    /**
     * Returns the card type identifier.
     */
    getCardType(): string {
        return 'detail';
    }

    /**
     * Toggle the expanded state.
     */
    toggle(): void {
        this.expanded = !this.expanded;
        this.toggled.emit(this.expanded);
    }
}
