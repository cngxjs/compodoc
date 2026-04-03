import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';

/**
 * Provides the user feature with all required services.
 * @since 1.0.0
 * @category Providers
 */
export function provideUserFeature(): EnvironmentProviders {
    return makeEnvironmentProviders([]);
}

/**
 * Adds caching support to the user feature.
 * @beta
 * @since 1.1.0
 */
export function withCaching(): Provider[] {
    return [];
}

/**
 * Creates a default user object.
 * @since 1.0.0
 * @category Factories
 */
export function createDefaultUser(): { name: string; email: string } {
    return { name: '', email: '' };
}

/**
 * Injects the current user count.
 * @signal
 * @since 1.0.0
 */
export function injectUserCount(): number {
    return 0;
}
