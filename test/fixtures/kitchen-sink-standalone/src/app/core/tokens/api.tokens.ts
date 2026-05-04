import { InjectionToken } from '@angular/core';

/**
 * Token for the base API URL.
 *
 * @example
 * ```typescript
 * providers: [{ provide: API_BASE_URL, useValue: 'https://api.example.com' }]
 * ```
 *
 * @since 2.0.0
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
    providedIn: 'root',
    factory: () => '/api',
});

/**
 * Token for feature flags.
 *
 * @beta
 */
export const FEATURE_FLAGS = new InjectionToken<Record<string, boolean>>('FEATURE_FLAGS', {
    providedIn: 'root',
    factory: () => ({ experimentalDashboard: false }),
});

/**
 * Token for the app version.
 */
export const APP_VERSION = new InjectionToken<string>('APP_VERSION', {
    providedIn: 'root',
    factory: () => '2.0.0',
});

/**
 * Token for the default page size.
 *
 * @deprecated Use the PageSizeService signal instead.
 */
export const DEFAULT_PAGE_SIZE = new InjectionToken<number>('DEFAULT_PAGE_SIZE', {
    providedIn: 'root',
    factory: () => 25,
});
