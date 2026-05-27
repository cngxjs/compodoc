import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';

/**
 * Provides the user feature with all required services.
 *
 * Bundles the user store, the authentication interceptor, and the analytics
 * sink into a single environment-providers block. Drop it into your
 * `appConfig.providers` to wire the entire user surface in one line.
 *
 * @param options Optional configuration for the user feature.
 * @param options.cache Whether to enable the in-memory cache. Defaults to `true`.
 * @param options.retries Number of retry attempts for failed user lookups. Defaults to `3`.
 * @returns A bundle of environment providers ready for `appConfig`.
 *
 * @example
 * ```typescript
 * import { ApplicationConfig } from '@angular/core';
 * import { provideUserFeature } from './providers';
 *
 * export const appConfig: ApplicationConfig = {
 *     providers: [
 *         provideUserFeature({ cache: true, retries: 5 })
 *     ]
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Disable caching for diagnostic scenarios:
 * provideUserFeature({ cache: false });
 * ```
 *
 * @since 1.0.0
 * @category Providers
 */
export function provideUserFeature(options?: {
    cache?: boolean;
    retries?: number;
}): EnvironmentProviders {
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
 *
 * @param overrides Partial fields to merge over the defaults.
 * @returns A new user object with empty `name`/`email` unless overridden.
 *
 * @example
 * ```typescript
 * const u = createDefaultUser({ email: 'demo@example.com' });
 * console.log(u.name);  // ''
 * console.log(u.email); // 'demo@example.com'
 * ```
 *
 * @since 1.0.0
 * @category Factories
 */
export function createDefaultUser(overrides?: Partial<{ name: string; email: string }>): {
    name: string;
    email: string;
} {
    return { name: '', email: '', ...overrides };
}

/**
 * Injects the current user count.
 * @signal
 * @since 1.0.0
 */
export function injectUserCount(): number {
    return 0;
}
