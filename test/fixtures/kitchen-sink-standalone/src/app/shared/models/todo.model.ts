/**
 * A todo item.
 */
export interface Todo {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: Date;
    priority?: TodoPriority;
    tags?: string[];
}

/**
 * Todo priority levels.
 */
export enum TodoPriority {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    /** @deprecated Use High with a due date. */
    Critical = 'critical',
}

/**
 * Filter criteria for todos.
 */
export interface TodoFilter {
    completed?: boolean;
    priority?: TodoPriority;
    search?: string;
}

/**
 * Statistics about todos.
 */
export interface TodoStats {
    total: number;
    completed: number;
    remaining: number;
    byPriority: Record<TodoPriority, number>;
}

/**
 * Sort direction.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration.
 */
export type TodoSort = {
    field: keyof Todo;
    direction: SortDirection;
};
