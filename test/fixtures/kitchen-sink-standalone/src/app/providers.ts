import { Provider, EnvironmentProviders, makeEnvironmentProviders, InjectionToken, inject, signal } from '@angular/core';

/**
 * Provide the user feature module services.
 *
 * A `provide*` function demonstrating functional provider patterns.
 *
 * @returns Environment providers for the user feature
 *
 * @example
 * ```typescript
 * bootstrapApplication(AppComponent, {
 *   providers: [provideUserFeature()]
 * });
 * ```
 *
 * @since 2.0.0
 */
export function provideUserFeature(): EnvironmentProviders {
    return makeEnvironmentProviders([]);
}

/**
 * Provide caching configuration.
 *
 * A `with*` function demonstrating the feature pattern.
 *
 * @param ttl - Cache time-to-live in ms
 * @returns Provider array
 */
export function withCaching(ttl: number = 60_000): Provider[] {
    return [{ provide: 'CACHE_TTL', useValue: ttl }];
}

/**
 * Factory function for creating a default user object.
 *
 * @returns A default user with guest role
 */
export function createDefaultUser() {
    return { id: 0, username: 'guest', email: '', role: 'guest' };
}

/**
 * Injection function for accessing the user count signal.
 *
 * @returns A read-only signal of the user count
 */
export function injectUserCount() {
    return signal(0).asReadonly();
}

/**
 * Provide analytics tracking.
 *
 * @param trackingId - The analytics tracking ID
 * @returns Environment providers
 *
 * @beta
 */
export function provideAnalytics(trackingId: string): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: 'ANALYTICS_ID', useValue: trackingId },
    ]);
}
