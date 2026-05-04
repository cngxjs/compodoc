import { InjectionToken } from '@angular/core';

/**
 * Token for maximum HTTP retry attempts.
 */
export const MAX_RETRIES = new InjectionToken<number>('MAX_RETRIES', {
    providedIn: 'root',
    factory: () => 3,
});
