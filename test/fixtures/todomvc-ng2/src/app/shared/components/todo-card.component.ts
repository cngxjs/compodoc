import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * A card component that displays a single todo item with rich interactions.
 *
 * @since 2.0.0
 * @zoneless
 * @beta
 * @route /todos/:id
 * @storybook https://storybook.example.com/?path=/story/todo-card
 * @figma https://figma.com/file/abc123/todo-card
 * @slot header - Custom header content above the todo title
 * @slot actions - Action buttons below the todo content
 * @group Display Components
 * @order 1
 *
 * @example
 * ```html
 * <app-todo-card [todo]="myTodo" (toggle)="onToggle($event)">
 *   <span slot="header">Priority: High</span>
 * </app-todo-card>
 * ```
 */
@Component({
    selector: 'app-todo-card',
    standalone: true,
    template: `
        <div class="todo-card" [class.completed]="todo?.completed">
            <ng-content select="[slot=header]"></ng-content>
            <h3>{{ todo?.title }}</h3>
            <ng-content select="[slot=actions]"></ng-content>
        </div>
    `,
    styles: [`
        .todo-card { border: 1px solid #ccc; padding: 1rem; border-radius: 8px; }
        .completed { opacity: 0.6; text-decoration: line-through; }
    `]
})
export class TodoCardComponent {
    /**
     * The todo item to display.
     * @signal
     * @since 2.0.0
     */
    @Input() todo: { title: string; completed: boolean } | null = null;

    /**
     * Emits when the todo completion state is toggled.
     * @since 2.0.0
     */
    @Output() toggle = new EventEmitter<boolean>();

    /**
     * Emits when the user requests to delete this todo.
     * @since 2.1.0
     * @breaking 3.0
     */
    @Output() delete = new EventEmitter<void>();

    /**
     * Toggle the completion state.
     * @group Actions
     * @order 1
     */
    onToggle(): void {
        if (this.todo) {
            this.toggle.emit(!this.todo.completed);
        }
    }

    /**
     * Request deletion of this todo.
     * @group Actions
     * @order 2
     * @beta
     */
    onDelete(): void {
        this.delete.emit();
    }

    /**
     * Check if the todo is overdue.
     * @group Computed
     * @since 2.0.0
     */
    get isOverdue(): boolean {
        return false;
    }
}
