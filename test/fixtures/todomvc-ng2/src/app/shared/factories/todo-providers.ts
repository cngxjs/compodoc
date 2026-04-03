import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';

/**
 * Provides the full Todo feature with store, effects, and API.
 * @since 2.0.0
 * @category Providers
 */
export function provideTodoFeature(): EnvironmentProviders {
    return makeEnvironmentProviders([]);
}

/**
 * Adds optimistic update support to the Todo feature.
 * @beta
 * @since 2.1.0
 */
export function withOptimisticUpdates(): Provider[] {
    return [];
}

/**
 * Injects the current todo count as a signal.
 * @signal
 * @since 2.0.0
 */
export function injectTodoCount(): number {
    return 0;
}

/**
 * Creates a Todo item with default values.
 * @since 1.0.0
 * @category Factories
 */
export function createDefaultTodo(): { title: string; completed: boolean } {
    return { title: '', completed: false };
}
