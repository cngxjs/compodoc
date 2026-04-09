/**
 * Represents a single todo item.
 *
 * @example
 * ```typescript
 * const todo: Todo = { id: '1', title: 'Buy milk', completed: false };
 * ```
 */
export interface Todo {
    /** Unique identifier */
    id: string;
    /** Display title */
    title: string;
    /** Whether the todo is completed */
    completed: boolean;
    /** Optional due date */
    dueDate?: Date;
    /** Priority level */
    priority?: TodoPriority;
    /** Tags for categorization */
    tags?: string[];
    /** Nested sub-tasks */
    subtasks?: Todo[];
}

/**
 * Priority levels for todos.
 *
 * @since 1.2.0
 */
export enum TodoPriority {
    /** Lowest urgency */
    Low = 'low',
    /** Normal urgency */
    Medium = 'medium',
    /** Highest urgency */
    High = 'high',
    /**
     * Critical priority — requires immediate attention.
     * @deprecated Use `High` with a due date instead.
     */
    Critical = 'critical',
}

/**
 * Filter criteria for querying todos.
 */
export interface TodoFilter {
    /** Filter by completion status */
    completed?: boolean;
    /** Filter by priority */
    priority?: TodoPriority;
    /** Full-text search on title */
    search?: string;
    /** Filter by tag */
    tag?: string;
}

/**
 * Statistics about the todo collection.
 */
export interface TodoStats {
    total: number;
    completed: number;
    remaining: number;
    byPriority: Record<TodoPriority, number>;
}

/**
 * Sorting options for todo lists.
 */
export type TodoSortField = 'title' | 'dueDate' | 'priority' | 'completed';

/**
 * Sort direction.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Combined sort configuration.
 */
export type TodoSort = {
    field: TodoSortField;
    direction: SortDirection;
};

/**
 * A callback for todo change events.
 */
export type TodoChangeCallback = (todo: Todo, action: 'add' | 'update' | 'delete') => void;

/**
 * Result of a batch operation on todos.
 */
export interface BatchResult<T = Todo> {
    success: T[];
    failed: Array<{ item: T; error: string }>;
    totalProcessed: number;
}
