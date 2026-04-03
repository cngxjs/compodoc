import { Component, computed, inject, input, output, signal, effect, viewChild, ElementRef } from '@angular/core';
import { User } from '../services/user.service';
import { HighlightDirective } from './highlight.directive';
import { API_BASE_URL } from '../tokens/api.token';

/**
 * Displays a single user card using modern Angular signals.
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
        <div class="card" #cardEl appHighlight>
            <h3>{{ displayName() }}</h3>
            <p>{{ user()?.email }}</p>
            <ng-content select="[slot=actions]"></ng-content>
        </div>
    `,
    styles: [`.card { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; }`],
})
export class UserCardComponent {
    /** API base URL injected via token. */
    private readonly apiUrl = inject(API_BASE_URL);

    /**
     * The user to display.
     * @since 1.0.0
     */
    readonly user = input.required<User>();

    /**
     * Emits when the user card is selected.
     * @since 1.0.0
     */
    readonly selected = output<User>();

    /**
     * Internal selection count.
     */
    readonly selectionCount = signal(0);

    /**
     * Display name derived from user.
     * @since 1.0.0
     */
    readonly displayName = computed(() => {
        const u = this.user();
        return u ? `${u.name} (${u.email})` : '';
    });

    /** Reference to the card element. */
    readonly cardElement = viewChild<ElementRef>('cardEl');

    /** Log effect for debugging. */
    private readonly logEffect = effect(() => {
        console.log('User changed:', this.user().name);
    });

    /**
     * Select this user.
     * @group Actions
     */
    onSelect(): void {
        this.selected.emit(this.user());
        this.selectionCount.update(c => c + 1);
    }
}
