/**
 * Generic typed event emitter.
 *
 * @example
 * ```typescript
 * const bus = new EventBus<{ save: string; load: number }>();
 * bus.on('save', (val) => console.log(val));
 * bus.emit('save', 'done');
 * ```
 */
export class EventBus<TEvents extends Record<string, unknown>> {
    private handlers = new Map<keyof TEvents, Set<(data: unknown) => void>>();

    /**
     * Subscribe to an event.
     */
    on<K extends keyof TEvents>(event: K, handler: (data: TEvents[K]) => void): () => void {
        if (!this.handlers.has(event)) this.handlers.set(event, new Set());
        const set = this.handlers.get(event)!;
        set.add(handler as (data: unknown) => void);
        return () => set.delete(handler as (data: unknown) => void);
    }

    /**
     * Emit an event.
     */
    emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
        this.handlers.get(event)?.forEach((h) => h(data));
    }

    /**
     * Remove all listeners.
     */
    clear(event?: keyof TEvents): void {
        event ? this.handlers.delete(event) : this.handlers.clear();
    }

    /**
     * Listener count.
     */
    size(event: keyof TEvents): number {
        return this.handlers.get(event)?.size ?? 0;
    }
}

/**
 * Builder pattern class for creating objects step by step.
 *
 * @example
 * ```typescript
 * const config = new Builder<AppConfig>()
 *   .set('apiUrl', '/api')
 *   .set('timeout', 5000)
 *   .build();
 * ```
 */
export class Builder<T extends Record<string, unknown>> {
    private data: Partial<T> = {};

    /**
     * Set a property.
     */
    set<K extends keyof T>(key: K, value: T[K]): this {
        this.data[key] = value;
        return this;
    }

    /**
     * Build the final object.
     */
    build(): T {
        return { ...this.data } as T;
    }

    /**
     * Reset all properties.
     */
    reset(): this {
        this.data = {};
        return this;
    }
}
