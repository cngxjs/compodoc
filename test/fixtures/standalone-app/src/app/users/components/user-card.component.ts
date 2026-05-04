import { Component, computed, inject, input, output, signal, effect, viewChild, ElementRef, afterNextRender, afterEveryRender, afterRenderEffect } from '@angular/core';
import { User } from '../user.service';
import { HighlightDirective } from '../../shared/directives/highlight.directive';
import { API_BASE_URL } from '../../core/tokens/api.token';

/**
 * Displays a single user card using modern Angular signals.
 *
 * @since 1.0.0
 * @beta
 * @link https://storybook.example.com/user-card Storybook
 * @link https://figma.com/design/abc123 Figma
 */
@Component({
    selector: 'app-user-card',
    standalone: true,
    imports: [HighlightDirective],
    template: `
        <div class="card" #cardEl appHighlight>
            <h3>{{ displayName() }}</h3>
            <p>{{ user()?.email }}</p>
            <ng-content select="[actions]"></ng-content>
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

    /** Measures card height once after first render. */
    private readonly measureOnce = afterNextRender(() => {
        const el = this.cardElement()?.nativeElement;
        if (el) {
            console.log('Card height:', el.offsetHeight);
        }
    });

    /** Keeps card border in sync with theme on every render cycle. */
    private readonly syncBorder = afterEveryRender(() => {
        const el = this.cardElement()?.nativeElement;
        if (el) {
            el.style.borderColor = getComputedStyle(el).getPropertyValue('--card-border') || '#ddd';
        }
    });

    /** Reactive render effect that updates the card shadow based on selection count. */
    private readonly shadowEffect = afterRenderEffect(() => {
        const count = this.selectionCount();
        const el = this.cardElement()?.nativeElement;
        if (el) {
            el.style.boxShadow = count > 0 ? `0 0 ${count * 2}px rgba(0,0,0,0.15)` : 'none';
        }
    });

    onSelect(): void {
        this.selected.emit(this.user());
        this.selectionCount.update(c => c + 1);
    }
}
