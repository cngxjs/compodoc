import { Component, Input } from '@angular/core';

/**
 * Abstract base card component demonstrating inheritance.
 *
 * Cannot be used directly — extend this component in subclasses.
 *
 * @example
 * ```typescript
 * @Component({ selector: 'app-detail-card', template: '...' })
 * export class DetailCardComponent extends BaseCardComponent {
 *   // add specialized behavior
 * }
 * ```
 *
 * @since 1.0.0
 */
@Component({
    selector: 'app-base-card',
    template: `<div class="card"><ng-content></ng-content></div>`,
})
export abstract class BaseCardComponent {
    /**
     * Card title.
     */
    @Input() title: string = '';

    /**
     * Whether the card has a border.
     */
    @Input() bordered: boolean = true;

    /**
     * Abstract method that subclasses must implement.
     */
    abstract getCardType(): string;

    /**
     * Get a formatted title with the card type prefix.
     */
    getFormattedTitle(): string {
        return `[${this.getCardType()}] ${this.title}`;
    }
}
