/**
 * Base entity with ID.
 */
export interface Identifiable {
    id: string | number;
}

/**
 * Timestamped entity.
 */
export interface Timestamped {
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Soft-deletable entity.
 */
export interface SoftDeletable {
    deletedAt?: Date;
    isDeleted: boolean;
}

/**
 * Base domain entity combining ID and timestamps.
 */
export interface BaseEntity extends Identifiable, Timestamped {
    displayName?: string;
}

/**
 * Full auditable entity.
 */
export interface AuditableEntity extends BaseEntity, SoftDeletable {
    createdBy: string;
    updatedBy: string;
}

/**
 * Repository interface for CRUD operations.
 */
export interface Repository<T extends Identifiable> {
    findById(id: T['id']): Promise<T | null>;
    findAll(): Promise<T[]>;
    create(entity: Omit<T, 'id'>): Promise<T>;
    update(id: T['id'], changes: Partial<T>): Promise<T>;
    delete(id: T['id']): Promise<boolean>;
}

/**
 * Validation result.
 */
export interface ValidationResult {
    valid: boolean;
    errors: Array<{ field: string; message: string; code: string }>;
}

/**
 * Search result with metadata.
 */
export interface SearchResult<T> {
    items: T[];
    total: number;
    query: string;
    took: number;
}

/**
 * Operation result discriminated union.
 */
export type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

/**
 * Event handler type.
 */
export type EventHandler<T = void> = (event: T) => void | Promise<void>;

/**
 * String-keyed dictionary.
 */
export type Dictionary<T = unknown> = Record<string, T>;
