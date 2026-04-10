import { InjectionToken } from '@angular/core';

/**
 * Token for the localStorage key used by the TodoStore.
 */
export const STORAGE_KEY = new InjectionToken<string>('STORAGE_KEY', {
    providedIn: 'root',
    factory: () => 'kitchen-sink-standalone-todos',
});

/**
 * Token for the session storage key.
 */
export const SESSION_KEY = new InjectionToken<string>('SESSION_KEY', {
    providedIn: 'root',
    factory: () => 'kitchen-sink-session',
});
