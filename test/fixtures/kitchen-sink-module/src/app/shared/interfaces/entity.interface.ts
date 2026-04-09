/**
 * Base entity with an ID.
 */
export interface Identifiable {
    /** The entity's unique identifier */
    id: string | number;
}

/**
 * Entity with timestamp tracking.
 */
export interface Timestamped {
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Entity with soft-delete support.
 */
export interface SoftDeletable {
    deletedAt?: Date;
    isDeleted: boolean;
}

/**
 * Combined base interface for all domain entities.
 *
 * @example
 * ```typescript
 * interface Product extends BaseEntity {
 *   name: string;
 *   price: number;
 * }
 * ```
 */
export interface BaseEntity extends Identifiable, Timestamped {
    /** Human-readable display name */
    displayName?: string;
}

/**
 * Full entity with audit trail and soft-delete.
 */
export interface AuditableEntity extends BaseEntity, SoftDeletable {
    /** ID of the user who created this entity */
    createdBy: string;
    /** ID of the user who last updated this entity */
    updatedBy: string;
}

/**
 * A generic repository interface for CRUD operations.
 */
export interface Repository<T extends Identifiable> {
    findById(id: T['id']): Promise<T | null>;
    findAll(): Promise<T[]>;
    create(entity: Omit<T, 'id'>): Promise<T>;
    update(id: T['id'], changes: Partial<T>): Promise<T>;
    delete(id: T['id']): Promise<boolean>;
}

/**
 * A function type for validating entities.
 */
export type Validator<T> = (entity: T) => ValidationResult;

/**
 * Result of a validation check.
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

/**
 * A single validation error.
 */
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

/**
 * Generic search function signature.
 */
export interface SearchFunction<T> {
    (query: string, options?: SearchOptions): Promise<SearchResult<T>>;
}

/**
 * Options for search operations.
 */
export interface SearchOptions {
    limit?: number;
    offset?: number;
    fuzzy?: boolean;
    fields?: string[];
}

/**
 * Wrapper for search results with metadata.
 */
export interface SearchResult<T> {
    items: T[];
    total: number;
    query: string;
    took: number;
}

/**
 * Index signature interface for string-keyed objects.
 */
export interface StringMap<V = unknown> {
    [key: string]: V;
}

/**
 * A tuple type for key-value pairs.
 */
export type KeyValuePair<K = string, V = unknown> = [K, V];

/**
 * Generic event handler type.
 */
export type EventHandler<T = void> = (event: T) => void | Promise<void>;

/**
 * A discriminated union for operation results.
 */
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };
