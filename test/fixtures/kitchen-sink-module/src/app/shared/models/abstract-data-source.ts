import { Observable } from 'rxjs';

/**
 * Abstract base class for data sources.
 *
 * Demonstrates abstract class documentation with generics.
 *
 * @example
 * ```typescript
 * class UserDataSource extends AbstractDataSource<User> {
 *   connect() { return this.http.get<User[]>('/users'); }
 *   disconnect() { this.subscription.unsubscribe(); }
 * }
 * ```
 */
export abstract class AbstractDataSource<T> {
    /**
     * Whether the data source is currently loading.
     */
    abstract readonly loading: boolean;

    /**
     * The total number of items available.
     */
    abstract readonly total: number;

    /**
     * Connect to the data source and start receiving data.
     *
     * @returns An observable stream of data arrays
     */
    abstract connect(): Observable<T[]>;

    /**
     * Disconnect from the data source and free resources.
     */
    abstract disconnect(): void;

    /**
     * Refresh the data source.
     */
    abstract refresh(): void;
}

/**
 * A class with a private constructor demonstrating factory pattern.
 *
 * @example
 * ```typescript
 * const singleton = Singleton.getInstance();
 * ```
 */
export class Singleton {
    private static instance: Singleton;

    /**
     * The instance identifier.
     */
    readonly id: string;

    private constructor() {
        this.id = Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get the singleton instance.
     *
     * @returns The single Singleton instance
     */
    static getInstance(): Singleton {
        if (!Singleton.instance) {
            Singleton.instance = new Singleton();
        }
        return Singleton.instance;
    }
}

/**
 * A generic collection class with index signatures.
 */
export class TypedCollection<T> {
    [index: number]: T;

    private items: T[] = [];

    /**
     * Add an item to the collection.
     */
    add(item: T): void {
        this.items.push(item);
    }

    /**
     * Get the number of items.
     */
    get length(): number {
        return this.items.length;
    }

    /**
     * Convert to a plain array.
     */
    toArray(): T[] {
        return [...this.items];
    }
}
