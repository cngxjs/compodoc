import { Injectable, signal, computed, inject } from '@angular/core';
import { Todo, TodoFilter, TodoPriority, TodoStats } from '../../shared/models/todo.model';
import { STORAGE_KEY } from '../tokens/storage.tokens';

/**
 * Reactive todo store using Angular signals.
 *
 * Provides signal-based state management with computed derivations.
 *
 * @example
 * ```typescript
 * const store = inject(TodoStore);
 * console.log(store.count()); // 0
 * store.add({ id: '1', title: 'Test', completed: false });
 * console.log(store.count()); // 1
 * ```
 *
 * @since 2.0.0
 */
@Injectable({ providedIn: 'root' })
export class TodoStore {
    private readonly storageKey = inject(STORAGE_KEY);

    /**
     * All todos as a writable signal.
     */
    readonly todos = signal<Todo[]>([]);

    /**
     * Total number of todos.
     */
    readonly count = computed(() => this.todos().length);

    /**
     * Number of completed todos.
     */
    readonly completedCount = computed(() => this.todos().filter((t) => t.completed).length);

    /**
     * Number of remaining (incomplete) todos.
     */
    readonly remainingCount = computed(() => this.count() - this.completedCount());

    /**
     * Whether all todos are completed.
     */
    readonly allCompleted = computed(() => this.count() > 0 && this.remainingCount() === 0);

    /**
     * Completion percentage.
     */
    readonly completionPercent = computed(() =>
        this.count() === 0 ? 0 : Math.round((this.completedCount() / this.count()) * 100)
    );

    /**
     * Statistics derived from current state.
     */
    readonly stats = computed<TodoStats>(() => {
        const todos = this.todos();
        const byPriority = {} as Record<TodoPriority, number>;
        Object.values(TodoPriority).forEach((p) => (byPriority[p] = 0));
        todos.forEach((t) => {
            if (t.priority) byPriority[t.priority]++;
        });
        return {
            total: todos.length,
            completed: this.completedCount(),
            remaining: this.remainingCount(),
            byPriority,
        };
    });

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Add a new todo.
     */
    add(todo: Todo): void {
        this.todos.update((todos) => [...todos, todo]);
        this.persist();
    }

    /**
     * Remove a todo by ID.
     */
    remove(id: string): void {
        this.todos.update((todos) => todos.filter((t) => t.id !== id));
        this.persist();
    }

    /**
     * Toggle a todo's completion.
     */
    toggle(id: string): void {
        this.todos.update((todos) =>
            todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
        );
        this.persist();
    }

    /**
     * Update a todo.
     */
    update(id: string, changes: Partial<Todo>): void {
        this.todos.update((todos) =>
            todos.map((t) => (t.id === id ? { ...t, ...changes } : t))
        );
        this.persist();
    }

    /**
     * Filter todos by criteria.
     */
    filter(filter: TodoFilter): Todo[] {
        return this.todos().filter((t) => {
            if (filter.completed !== undefined && t.completed !== filter.completed) return false;
            if (filter.priority && t.priority !== filter.priority) return false;
            if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
            return true;
        });
    }

    /**
     * Remove all completed todos.
     */
    clearCompleted(): void {
        this.todos.update((todos) => todos.filter((t) => !t.completed));
        this.persist();
    }

    /** @internal */
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) this.todos.set(JSON.parse(data));
        } catch {
            this.todos.set([]);
        }
    }

    /** @internal */
    private persist(): void {
        localStorage.setItem(this.storageKey, JSON.stringify(this.todos()));
    }
}
