/**
 * A generic event emitter class (non-Angular).
 *
 * Demonstrates plain class documentation with generics,
 * index signatures, and Map usage.
 *
 * @example
 * ```typescript
 * const emitter = new TypedEventEmitter<{ click: MouseEvent; resize: UIEvent }>();
 * emitter.on('click', (e) => console.log(e.clientX));
 * emitter.emit('click', new MouseEvent('click'));
 * ```
 *
 * @since 1.0.0
 */
export class TypedEventEmitter<TEvents extends Record<string, unknown>> {
    /**
     * Internal listener storage.
     * @internal
     */
    private listeners = new Map<keyof TEvents, Set<(event: unknown) => void>>();

    /**
     * Subscribe to an event.
     *
     * @param event - The event name
     * @param callback - The callback function
     * @returns An unsubscribe function
     */
    on<K extends keyof TEvents>(
        event: K,
        callback: (event: TEvents[K]) => void
    ): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        const set = this.listeners.get(event)!;
        set.add(callback as (event: unknown) => void);

        return () => set.delete(callback as (event: unknown) => void);
    }

    /**
     * Subscribe to an event for a single invocation.
     *
     * @param event - The event name
     * @param callback - The callback function
     */
    once<K extends keyof TEvents>(
        event: K,
        callback: (event: TEvents[K]) => void
    ): void {
        const unsub = this.on(event, (e) => {
            unsub();
            callback(e);
        });
    }

    /**
     * Emit an event with data.
     *
     * @param event - The event name
     * @param data - The event payload
     */
    emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
        const set = this.listeners.get(event);
        if (set) {
            set.forEach((cb) => cb(data));
        }
    }

    /**
     * Remove all listeners for a specific event, or all events.
     *
     * @param event - Optional event name; if omitted, clears all
     */
    removeAllListeners(event?: keyof TEvents): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get the number of listeners for an event.
     */
    listenerCount(event: keyof TEvents): number {
        return this.listeners.get(event)?.size ?? 0;
    }
}

/**
 * A state machine class demonstrating complex generics.
 *
 * @example
 * ```typescript
 * type States = 'idle' | 'loading' | 'done';
 * type Events = 'start' | 'complete';
 * const machine = new StateMachine<States, Events>('idle');
 * machine.addTransition('idle', 'start', 'loading');
 * machine.send('start');
 * ```
 */
export class StateMachine<TState extends string, TEvent extends string> {
    /**
     * Current state.
     */
    private currentState: TState;

    /**
     * Transition table.
     */
    private transitions = new Map<string, TState>();

    /**
     * History of state changes.
     */
    readonly history: Array<{ from: TState; to: TState; event: TEvent; timestamp: number }> = [];

    constructor(
        /** The initial state */
        public readonly initialState: TState
    ) {
        this.currentState = initialState;
    }

    /**
     * Get the current state.
     */
    get state(): TState {
        return this.currentState;
    }

    /**
     * Register a state transition.
     *
     * @param from - Source state
     * @param event - Trigger event
     * @param to - Target state
     */
    addTransition(from: TState, event: TEvent, to: TState): void {
        this.transitions.set(`${from}:${event}`, to);
    }

    /**
     * Send an event to trigger a transition.
     *
     * @param event - The event to send
     * @returns True if a transition occurred
     */
    send(event: TEvent): boolean {
        const key = `${this.currentState}:${event}`;
        const nextState = this.transitions.get(key);
        if (nextState) {
            this.history.push({
                from: this.currentState,
                to: nextState,
                event,
                timestamp: Date.now(),
            });
            this.currentState = nextState;
            return true;
        }
        return false;
    }

    /**
     * Reset to initial state.
     */
    reset(): void {
        this.currentState = this.initialState;
    }
}
