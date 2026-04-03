import { InjectionToken } from '@angular/core';

/**
 * Configuration for the API client.
 * @since 2.0.0
 * @beta
 */
export interface ApiConfig {
    baseUrl: string;
    timeout: number;
    retryCount: number;
}

/**
 * Token providing the API configuration.
 * @since 2.0.0
 * @category Configuration
 */
export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
    providedIn: 'root',
    factory: () => ({
        baseUrl: '/api',
        timeout: 5000,
        retryCount: 3,
    }),
});

/**
 * Token for the application theme.
 * @since 1.5.0
 */
export const THEME_TOKEN = new InjectionToken<string>('THEME_TOKEN');

/**
 * Token for feature flags.
 * @beta
 * @breaking 3.0
 */
export const FEATURE_FLAGS = new InjectionToken<Record<string, boolean>>('FEATURE_FLAGS');
