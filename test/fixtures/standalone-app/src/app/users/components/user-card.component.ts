import { Component, computed, inject, input, output, signal, effect, viewChild, ElementRef } from '@angular/core';
import { User } from '../user.service';
import { HighlightDirective } from '../../shared/directives/highlight.directive';
import { API_BASE_URL } from '../../core/tokens/api.token';

/**
 * Displays a single user card using modern Angular signals.
 *
 * @since 1.0.0
 * @beta
 */
@Component({
    selector: 'app-user-card',
    standalone: true,
    imports: [HighlightDirective],
    template: `
        <div class="card" #cardEl appHighlight>
            <h3>{{ displayName() }}</h3>
            <p>{{ user()?.email }}</p>
        </div>
    `,
    styles: [`.card { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; }`],
})
export class UserCardComponent {
    private readonly apiUrl = inject(API_BASE_URL);
    readonly user = input.required<User>();
    readonly selected = output<User>();
    readonly selectionCount = signal(0);
    readonly displayName = computed(() => {
        const u = this.user();
        return u ? `${u.name} (${u.email})` : '';
    });
    readonly cardElement = viewChild<ElementRef>('cardEl');
    private readonly logEffect = effect(() => {
        console.log('User changed:', this.user().name);
    });

    onSelect(): void {
        this.selected.emit(this.user());
        this.selectionCount.update(c => c + 1);
    }
}
