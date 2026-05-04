import {
    Component,
    Input,
    Output,
    EventEmitter,
    HostBinding,
    HostListener,
    ChangeDetectionStrategy,
    ViewEncapsulation,
} from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Todo } from '../../core/models/todo.model';

/**
 * Renders a single todo item with animations and interactions.
 *
 * Demonstrates animations, host bindings, host listeners,
 * and multiple encapsulation modes.
 *
 * @example
 * ```html
 * <app-todo-item
 *   [todo]="myTodo"
 *   (completed)="onComplete($event)"
 *   (deleted)="onDelete($event)">
 * </app-todo-item>
 * ```
 *
 * @since 1.0.0
 *
 * @storybook https://storybook.example.com/todo-item
 * @figma https://figma.com/file/abc123/todo-item
 * @route /todos/:id
 */
@Component({
    selector: 'app-todo-item',
    template: `
        <div class="todo-item" [@fadeInOut]>
            <input type="checkbox" [checked]="todo.completed" (change)="toggle()" />
            <span [class.completed]="todo.completed">{{ todo.title }}</span>
            <button (click)="remove()">×</button>
        </div>
    `,
    styleUrls: ['./todo-item.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.Emulated,
    animations: [
        trigger('fadeInOut', [
            state('void', style({ opacity: 0, transform: 'translateY(-10px)' })),
            transition(':enter', [animate('200ms ease-out')]),
            transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
        ]),
    ],
})
export class TodoItemComponent {
    /**
     * The todo data to render.
     */
    @Input() todo!: Todo;

    /**
     * Whether the item is in compact display mode.
     */
    @Input() compact: boolean = false;

    /**
     * Emitted when the todo is toggled.
     */
    @Output() completed = new EventEmitter<Todo>();

    /**
     * Emitted when the todo is deleted.
     */
    @Output() deleted = new EventEmitter<Todo>();

    /**
     * Emitted when the item receives focus.
     */
    @Output() focused = new EventEmitter<void>();

    /**
     * Apply completed CSS class to host.
     */
    @HostBinding('class.is-completed')
    get isCompleted(): boolean {
        return this.todo?.completed ?? false;
    }

    /**
     * Set aria-label on host.
     */
    @HostBinding('attr.aria-label')
    get hostAriaLabel(): string {
        return `Todo: ${this.todo?.title ?? 'unknown'}`;
    }

    /**
     * Set tabindex for keyboard navigation.
     */
    @HostBinding('attr.tabindex') tabIndex = 0;

    /**
     * Handle click events on the host element.
     */
    @HostListener('click')
    onClick(): void {
        this.toggle();
    }

    /**
     * Handle keyboard Enter on the host.
     */
    @HostListener('keydown.enter')
    onEnter(): void {
        this.toggle();
    }

    /**
     * Handle focus on the host.
     */
    @HostListener('focus')
    onFocus(): void {
        this.focused.emit();
    }

    /**
     * Toggle the todo's completion status.
     */
    toggle(): void {
        this.completed.emit(this.todo);
    }

    /**
     * Remove this todo item.
     */
    remove(): void {
        this.deleted.emit(this.todo);
    }
}
