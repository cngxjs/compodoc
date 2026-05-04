import {
    Component,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    ViewChildren,
    ContentChild,
    ContentChildren,
    TemplateRef,
    QueryList,
    ElementRef,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
} from '@angular/core';
import { Todo, TodoFilter, TodoSort } from '../../core/models/todo.model';
import { TodoItemComponent } from './todo-item.component';

/**
 * Displays a filterable, sortable list of todo items.
 *
 * Supports both simple rendering and custom templates via
 * content projection.
 *
 * @example
 * ```html
 * <app-todo-list
 *   [todos]="myTodos"
 *   [filter]="activeFilter"
 *   (todoSelected)="onSelect($event)"
 *   (todosReordered)="onReorder($event)">
 *   <ng-template #itemTemplate let-todo>
 *     <custom-item [data]="todo"></custom-item>
 *   </ng-template>
 * </app-todo-list>
 * ```
 *
 * @since 1.0.0
 *
 * @slot itemTemplate - Custom template for rendering individual items
 * @slot emptyTemplate - Template shown when the list is empty
 */
@Component({
    selector: 'app-todo-list',
    template: `
        <div class="todo-list" #listContainer>
            <div *ngFor="let todo of filteredTodos; trackBy: trackById">
                <app-todo-item
                    #itemRef
                    [todo]="todo"
                    (completed)="onItemCompleted($event)"
                    (deleted)="onItemDeleted($event)">
                </app-todo-item>
            </div>
        </div>
    `,
    styles: [`:host { display: block; }`],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoListComponent implements OnInit, OnDestroy {
    /**
     * The complete list of todos to display.
     */
    @Input() todos: Todo[] = [];

    /**
     * Active filter criteria.
     */
    @Input() filter?: TodoFilter;

    /**
     * Active sort configuration.
     */
    @Input() sort?: TodoSort;

    /**
     * Whether to enable drag-and-drop reordering.
     * @beta
     */
    @Input() reorderable: boolean = false;

    /**
     * Maximum number of items to display.
     */
    @Input() limit?: number;

    /**
     * Emitted when a todo item is selected.
     */
    @Output() todoSelected = new EventEmitter<Todo>();

    /**
     * Emitted when the list is reordered.
     */
    @Output() todosReordered = new EventEmitter<Todo[]>();

    /**
     * Emitted when a todo is completed from within the list.
     */
    @Output() todoCompleted = new EventEmitter<Todo>();

    /**
     * Emitted when a todo is deleted from within the list.
     */
    @Output() todoDeleted = new EventEmitter<Todo>();

    /**
     * Reference to the list container element.
     */
    @ViewChild('listContainer') listContainer!: ElementRef;

    /**
     * All rendered todo item component instances.
     */
    @ViewChildren('itemRef') itemRefs!: QueryList<TodoItemComponent>;

    /**
     * Custom item template provided by the consumer.
     */
    @ContentChild('itemTemplate') itemTemplate?: TemplateRef<unknown>;

    /**
     * Custom empty-state templates.
     */
    @ContentChildren('emptyTemplate') emptyTemplates!: QueryList<TemplateRef<unknown>>;

    /**
     * Internal filtered list.
     */
    protected filteredTodos: Todo[] = [];

    /** @ignore */
    ngOnInit(): void {
        this.applyFilter();
    }

    /** @ignore */
    ngOnDestroy(): void {
        // cleanup
    }

    /**
     * Track function for ngFor performance.
     */
    trackById(_index: number, todo: Todo): string {
        return todo.id;
    }

    /**
     * Apply the current filter and sort to the todo list.
     */
    applyFilter(): void {
        let result = [...this.todos];

        if (this.filter) {
            if (this.filter.completed !== undefined) {
                result = result.filter((t) => t.completed === this.filter!.completed);
            }
            if (this.filter.search) {
                const q = this.filter.search.toLowerCase();
                result = result.filter((t) => t.title.toLowerCase().includes(q));
            }
        }

        if (this.limit) {
            result = result.slice(0, this.limit);
        }

        this.filteredTodos = result;
    }

    /**
     * Handle item completion from child component.
     * @internal
     */
    private onItemCompleted(todo: Todo): void {
        this.todoCompleted.emit(todo);
    }

    /**
     * Handle item deletion from child component.
     * @internal
     */
    private onItemDeleted(todo: Todo): void {
        this.todoDeleted.emit(todo);
    }
}
