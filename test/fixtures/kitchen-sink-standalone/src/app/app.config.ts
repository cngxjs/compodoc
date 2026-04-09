import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { retryInterceptor } from './core/interceptors/retry.interceptor';

/**
 * Application configuration for the standalone kitchen-sink demo.
 *
 * Uses functional providers for routing, HTTP, and animations.
 *
 * @example
 * ```typescript
 * bootstrapApplication(AppComponent, appConfig);
 * ```
 *
 * @since 2.0.0
 */
export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
        provideHttpClient(
            withInterceptors([loggingInterceptor, authInterceptor, cacheInterceptor, retryInterceptor])
        ),
        provideAnimationsAsync(),
    ],
};
