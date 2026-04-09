import { ApplicationConfig } from '@angular/core';
import {
    provideRouter,
    withComponentInputBinding,
    withViewTransitions,
    withPreloading,
    PreloadAllModules,
    withRouterConfig,
} from '@angular/router';
import {
    provideHttpClient,
    withInterceptors,
    withFetch,
    withXsrfConfiguration,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { loggingInterceptor } from './core/interceptors/logging.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { retryInterceptor } from './core/interceptors/retry.interceptor';

import {
    provideUserFeature,
    withUserCaching,
    withUserSync,
    provideAuth,
    withOAuth,
    withMfa,
    withSessionTimeout,
    provideAnalytics,
    withConsentManager,
    withCustomDimensions,
    provideLogging,
    withErrorReporting,
    provideFeatureFlags,
    withRemoteFlags,
    provideI18n,
    provideNotifications,
} from './providers';

/**
 * Main application configuration for the enterprise standalone demo.
 *
 * Demonstrates a full-featured Angular application with:
 * - Advanced routing (preloading, input binding, view transitions)
 * - HTTP client with multiple interceptors, fetch backend, XSRF protection
 * - Server-side rendering with hydration and event replay
 * - Service worker for PWA support
 * - Custom enterprise providers (auth, analytics, feature flags, i18n, logging)
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
        // ─── Routing ────────────────────────────────────────
        provideRouter(
            routes,
            withComponentInputBinding(),
            withViewTransitions(),
            withPreloading(PreloadAllModules),
            withRouterConfig({ onSameUrlNavigation: 'reload' })
        ),

        // ─── HTTP ───────────────────────────────────────────
        provideHttpClient(
            withInterceptors([
                loggingInterceptor,
                authInterceptor,
                cacheInterceptor,
                retryInterceptor,
            ]),
            withFetch(),
            withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })
        ),

        // ─── Platform ───────────────────────────────────────
        provideAnimationsAsync(),
        provideClientHydration(withEventReplay()),
        provideServiceWorker('ngsw-worker.js', {
            enabled: true,
            registrationStrategy: 'registerWhenStable:30000',
        }),

        // ─── Auth ───────────────────────────────────────────
        provideAuth(
            withOAuth({ clientId: 'kitchen-sink-app', issuer: 'https://auth.example.com' }),
            withMfa(['totp', 'email']),
            withSessionTimeout(30 * 60_000)
        ),

        // ─── User Management ────────────────────────────────
        provideUserFeature(withUserCaching(30_000), withUserSync('/ws/users')),

        // ─── Observability ──────────────────────────────────
        provideAnalytics(
            'G-ENTERPRISE123',
            withConsentManager(),
            withCustomDimensions({ team: 'platform', environment: 'production' })
        ),
        provideLogging('info'),

        // ─── Feature Management ─────────────────────────────
        provideFeatureFlags(
            { newDashboard: true, darkMode: true, experimentalSearch: false },
            withRemoteFlags('https://flags.example.com/api/v2', 120_000)
        ),

        // ─── i18n & UX ─────────────────────────────────────
        provideI18n('en-US', ['en-US', 'de-DE', 'fr-FR', 'ja-JP', 'zh-CN']),
        provideNotifications(5),
    ],
};

/**
 * Minimal test configuration without network-dependent providers.
 *
 * Use this for unit tests to avoid service worker registration,
 * remote feature flags, and analytics tracking.
 *
 * @example
 * ```typescript
 * TestBed.configureTestingModule({ providers: testConfig.providers });
 * ```
 *
 * @since 2.1.0
 */
export const testConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(withInterceptors([loggingInterceptor])),
        provideAnimationsAsync(),
        provideAuth(withSessionTimeout(5 * 60_000)),
        provideUserFeature(),
        provideFeatureFlags({ newDashboard: true, darkMode: true, experimentalSearch: true }),
        provideI18n('en-US', ['en-US']),
        provideLogging('debug'),
    ],
};
