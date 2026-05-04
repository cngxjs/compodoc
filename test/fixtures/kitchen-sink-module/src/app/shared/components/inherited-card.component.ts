import { Component, Input } from '@angular/core';
import { DetailCardComponent } from './detail-card.component';

/**
 * A deeply inherited card demonstrating multi-level inheritance.
 *
 * Extends `DetailCardComponent` which extends `BaseCardComponent`.
 * Adds color theming on top of the expand/collapse behavior.
 *
 * @since 1.3.0
 */
@Component({
    selector: 'app-inherited-card',
    template: `
        <div class="card" [style.borderColor]="color">
            <div class="card-header" (click)="toggle()">{{ getFormattedTitle() }}</div>
            <div *ngIf="expanded" class="card-body"><ng-content></ng-content></div>
        </div>
    `,
})
export class InheritedCardComponent extends DetailCardComponent {
    /**
     * Border color for theming.
     */
    @Input() color: string = '#3b82f6';

    /**
     * Returns the card type, overriding the parent.
     */
    override getCardType(): string {
        return 'inherited';
    }
}
