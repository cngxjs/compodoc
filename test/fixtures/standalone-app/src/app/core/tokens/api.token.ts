import { InjectionToken } from '@angular/core';

/**
 * Base URL for the API.
 * @since 1.0.0
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
    providedIn: 'root',
    factory: () => 'https://api.example.com',
});

/**
 * Feature flags for the application.
 * @beta
 * @since 1.1.0
 */
export const FEATURE_FLAGS = new InjectionToken<Record<string, boolean>>('FEATURE_FLAGS');
