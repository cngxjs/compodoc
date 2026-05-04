import { Injectable } from '@angular/core';

/**
 * Configuration for a cache entry.
 */
export interface CacheConfig {
    /** Time-to-live in milliseconds */
    ttl: number;
    /** Maximum number of entries */
    maxSize?: number;
}

/**
 * A single cache entry with metadata.
 */
interface CacheEntry<T> {
    value: T;
    expiresAt: number;
    hits: number;
}

/**
 * Generic in-memory cache service with TTL support.
 *
 * @example
 * ```typescript
 * const cache = new CacheService();
 * cache.set('users', userList, { ttl: 60000 });
 * const cached = cache.get<User[]>('users');
 * ```
 *
 * @since 1.1.0
 */
@Injectable()
export class CacheService {
    /** Internal cache map */
    private cache = new Map<string, CacheEntry<unknown>>();

    /** Default TTL of 5 minutes */
    private readonly DEFAULT_TTL = 300_000;

    /**
     * Store a value in the cache.
     *
     * @param key - The cache key
     * @param value - The value to cache
     * @param config - Optional cache configuration
     */
    set<T>(key: string, value: T, config?: Partial<CacheConfig>): void {
        const ttl = config?.ttl ?? this.DEFAULT_TTL;
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttl,
            hits: 0,
        });
    }

    /**
     * Retrieve a cached value.
     *
     * @param key - The cache key
     * @returns The cached value, or undefined if expired/missing
     */
    get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }
        entry.hits++;
        return entry.value as T;
    }

    /**
     * Check whether a key exists and is not expired.
     */
    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    /**
     * Remove a specific cache entry.
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache entries.
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get the number of cached entries (including expired).
     */
    get size(): number {
        return this.cache.size;
    }
}
