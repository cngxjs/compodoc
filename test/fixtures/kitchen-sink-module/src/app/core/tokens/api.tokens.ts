import { InjectionToken } from '@angular/core';

/**
 * Token for the base API URL.
 *
 * @example
 * ```typescript
 * providers: [{ provide: API_BASE_URL, useValue: 'https://api.example.com' }]
 * ```
 *
 * @since 1.0.0
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
    providedIn: 'root',
    factory: () => '/api',
});

/**
 * Token for feature flag configuration.
 *
 * @example
 * ```typescript
 * providers: [{ provide: FEATURE_FLAGS, useValue: { darkMode: true } }]
 * ```
 */
export const FEATURE_FLAGS = new InjectionToken<Record<string, boolean>>('FEATURE_FLAGS', {
    providedIn: 'root',
    factory: () => ({}),
});

/**
 * Token for the application version string.
 */
export const APP_VERSION = new InjectionToken<string>('APP_VERSION');

/**
 * Token for max retry attempts in HTTP calls.
 */
export const MAX_RETRIES = new InjectionToken<number>('MAX_RETRIES', {
    providedIn: 'root',
    factory: () => 3,
});

/**
 * Token for the default page size in paginated views.
 *
 * @beta
 */
export const DEFAULT_PAGE_SIZE = new InjectionToken<number>('DEFAULT_PAGE_SIZE', {
    providedIn: 'root',
    factory: () => 25,
});

/**
 * Token for a custom logger function.
 *
 * @deprecated Use `NotificationService` for user-facing messages instead.
 */
export const LOGGER_FN = new InjectionToken<(msg: string) => void>('LOGGER_FN');
