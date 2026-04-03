import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../services/user.service';
import { HighlightDirective } from './highlight.directive';

/**
 * Displays a single user card.
 *
 * @since 1.0.0
 * @beta
 * @figma https://figma.com/file/xyz/user-card
 * @storybook https://storybook.example.com/?path=/story/user-card
 * @slot actions - Action buttons for the user card
 * @group Display Components
 * @order 2
 */
@Component({
    selector: 'app-user-card',
    standalone: true,
    imports: [HighlightDirective],
    template: `
        <div class="card" appHighlight>
            <h3>{{ user?.name }}</h3>
            <p>{{ user?.email }}</p>
            <ng-content select="[slot=actions]"></ng-content>
        </div>
    `,
    styles: [`.card { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; }`],
})
export class UserCardComponent {
    /**
     * The user to display.
     * @signal
     * @since 1.0.0
     */
    @Input() user: User | null = null;

    /**
     * Emits when the user card is selected.
     * @since 1.0.0
     */
    @Output() selected = new EventEmitter<User>();

    /**
     * Select this user.
     * @group Actions
     */
    onSelect(): void {
        if (this.user) {
            this.selected.emit(this.user);
        }
    }
}
