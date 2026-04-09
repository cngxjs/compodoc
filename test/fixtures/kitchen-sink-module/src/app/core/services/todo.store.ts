import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, delay, tap } from 'rxjs/operators';

import { Todo, TodoFilter, TodoPriority, TodoStats, BatchResult, TodoSort } from '../models/todo.model';

/**
 * Central store for managing todo items.
 *
 * Provides CRUD operations, filtering, sorting, and statistics.
 * Persists data to localStorage.
 *
 * @example
 * ```typescript
 * constructor(private store: TodoStore) {
 *   store.todos$.subscribe(todos => console.log(todos));
 *   store.add({ id: '1', title: 'Test', completed: false });
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class TodoStore {
    /**
     * Internal list of todos.
     */
    private _todos: Todo[] = [];

    /**
     * Observable stream of all todos.
     */
    private todosSubject = new BehaviorSubject<Todo[]>([]);

    /**
     * Public observable of the todo list.
     */
    readonly todos$: Observable<Todo[]> = this.todosSubject.asObservable();

    /**
     * Observable of the total todo count.
     */
    readonly count$: Observable<number> = this.todos$.pipe(map((t) => t.length));

    /**
     * Storage key for localStorage persistence.
     * @internal
     */
    private readonly STORAGE_KEY = 'kitchen-sink-todos';

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Full name getter demonstrating accessor documentation.
     *
     * @example
     * ```typescript
     * console.log(store.storeName); // 'TodoStore'
     * ```
     */
    get storeName(): string {
        return 'TodoStore';
    }

    /**
     * Set the store identifier.
     * @deprecated The store name is now read-only.
     */
    set storeName(value: string) {
        // no-op, deprecated
    }

    /**
     * Whether all todos are completed.
     */
    get allCompleted(): boolean {
        return this._todos.length > 0 && this._todos.every((t) => t.completed);
    }

    /**
     * Get all todo items.
     * @returns A copy of the todo array.
     */
    getAll(): Todo[] {
        return [...this._todos];
    }

    /**
     * Get a single todo by ID.
     *
     * @param id - The todo identifier
     * @returns The found todo or undefined
     */
    getById(id: string): Todo | undefined {
        return this._todos.find((t) => t.id === id);
    }

    /**
     * Add a new todo item.
     *
     * @param todo - The todo to add
     * @returns The added todo
     *
     * @example
     * ```typescript
     * store.add({ id: '1', title: 'New task', completed: false });
     * ```
     */
    add(todo: Todo): Todo {
        this._todos.push(todo);
        this.persist();
        return todo;
    }

    /**
     * Update an existing todo.
     *
     * @param id - The ID of the todo to update
     * @param changes - Partial changes to apply
     * @returns The updated todo, or undefined if not found
     */
    update(id: string, changes: Partial<Todo>): Todo | undefined {
        const idx = this._todos.findIndex((t) => t.id === id);
        if (idx === -1) return undefined;
        this._todos[idx] = { ...this._todos[idx], ...changes };
        this.persist();
        return this._todos[idx];
    }

    /**
     * Remove a todo by ID.
     *
     * @param id - The ID of the todo to remove
     * @returns True if the todo was removed
     */
    remove(id: string): boolean {
        const len = this._todos.length;
        this._todos = this._todos.filter((t) => t.id !== id);
        this.persist();
        return this._todos.length < len;
    }

    /**
     * Toggle the completed state of a todo.
     */
    toggleCompletion(id: string): void {
        const todo = this.getById(id);
        if (todo) {
            this.update(id, { completed: !todo.completed });
        }
    }

    /**
     * Set all todos to the given completed state.
     *
     * @param completed - The target completed state
     */
    setAllTo(completed: boolean): void {
        this._todos.forEach((t) => (t.completed = completed));
        this.persist();
    }

    /**
     * Remove all completed todos.
     *
     * @returns The number of removed todos
     */
    removeCompleted(): number {
        const before = this._todos.length;
        this._todos = this._todos.filter((t) => !t.completed);
        this.persist();
        return before - this._todos.length;
    }

    /**
     * Filter todos based on criteria.
     *
     * @param filter - The filter criteria
     * @returns Filtered todo array
     */
    filter(filter: TodoFilter): Todo[] {
        return this._todos.filter((t) => {
            if (filter.completed !== undefined && t.completed !== filter.completed) return false;
            if (filter.priority && t.priority !== filter.priority) return false;
            if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
            if (filter.tag && (!t.tags || !t.tags.includes(filter.tag))) return false;
            return true;
        });
    }

    /**
     * Sort todos by the given configuration.
     *
     * @param sort - Sort field and direction
     * @returns Sorted array (does not mutate internal state)
     */
    sort(sort: TodoSort): Todo[] {
        const items = [...this._todos];
        const dir = sort.direction === 'asc' ? 1 : -1;
        items.sort((a, b) => {
            const aVal = a[sort.field];
            const bVal = b[sort.field];
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            return aVal > bVal ? dir : aVal < bVal ? -dir : 0;
        });
        return items;
    }

    /**
     * Get statistics about the todo collection.
     */
    getStats(): TodoStats {
        const byPriority = {} as Record<TodoPriority, number>;
        Object.values(TodoPriority).forEach((p) => (byPriority[p] = 0));
        this._todos.forEach((t) => {
            if (t.priority) byPriority[t.priority]++;
        });
        return {
            total: this._todos.length,
            completed: this._todos.filter((t) => t.completed).length,
            remaining: this._todos.filter((t) => !t.completed).length,
            byPriority,
        };
    }

    /**
     * Perform a batch update operation.
     *
     * @param ids - The IDs to update
     * @param changes - Changes to apply to each
     * @returns Batch operation result
     */
    batchUpdate(ids: string[], changes: Partial<Todo>): BatchResult {
        const result: BatchResult = { success: [], failed: [], totalProcessed: 0 };
        for (const id of ids) {
            result.totalProcessed++;
            const updated = this.update(id, changes);
            if (updated) {
                result.success.push(updated);
            } else {
                result.failed.push({ item: { id } as Todo, error: `Todo ${id} not found` });
            }
        }
        return result;
    }

    /**
     * Simulate an async fetch with delay.
     *
     * @param delayMs - Artificial delay in milliseconds
     * @returns Observable of all todos after the delay
     */
    fetchAsync(delayMs: number = 500): Observable<Todo[]> {
        return of(this.getAll()).pipe(delay(delayMs));
    }

    /**
     * Export todos as JSON string.
     * @returns Serialized JSON
     */
    exportAsJson(): string {
        return JSON.stringify(this._todos, null, 2);
    }

    /**
     * Import todos from a JSON string, replacing current state.
     *
     * @param json - The JSON string to import
     * @throws Error if the JSON is invalid
     */
    importFromJson(json: string): void {
        try {
            this._todos = JSON.parse(json);
            this.persist();
        } catch {
            throw new Error('Invalid JSON format');
        }
    }

    /**
     * Load todos from localStorage.
     * @internal
     */
    private loadFromStorage(): void {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                this._todos = JSON.parse(data);
                this.todosSubject.next(this._todos);
            }
        } catch {
            this._todos = [];
        }
    }

    /**
     * Persist current state to localStorage.
     * @internal
     */
    private persist(): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._todos));
        this.todosSubject.next([...this._todos]);
    }
}
