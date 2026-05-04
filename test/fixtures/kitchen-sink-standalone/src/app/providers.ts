import {
    Provider,
    EnvironmentProviders,
    makeEnvironmentProviders,
    InjectionToken,
    inject,
    signal,
} from '@angular/core';

// ─── User Feature ───────────────────────────────────────────────

/**
 * Provide the user management feature.
 *
 * Registers `UserService`, `UserStore`, and related providers.
 * Optionally compose with `withUserCaching()` or `withUserSync()`.
 *
 * @returns Environment providers for the user feature
 *
 * @example
 * ```typescript
 * bootstrapApplication(AppComponent, {
 *   providers: [provideUserFeature(withUserCaching(30_000))]
 * });
 * ```
 *
 * @since 2.0.0
 */
export function provideUserFeature(...features: Provider[][]): EnvironmentProviders {
    return makeEnvironmentProviders([...features.flat()]);
}

/**
 * Enable user data caching with configurable TTL.
 *
 * @param ttl - Cache time-to-live in milliseconds (default 60s)
 * @returns Provider array to compose with `provideUserFeature()`
 */
export function withUserCaching(ttl: number = 60_000): Provider[] {
    return [{ provide: 'USER_CACHE_TTL', useValue: ttl }];
}

/**
 * Enable real-time user synchronization via WebSocket.
 *
 * @param endpoint - WebSocket endpoint URL
 * @returns Provider array to compose with `provideUserFeature()`
 *
 * @beta
 */
export function withUserSync(endpoint: string = '/ws/users'): Provider[] {
    return [{ provide: 'USER_SYNC_ENDPOINT', useValue: endpoint }];
}

// ─── Auth Feature ───────────────────────────────────────────────

/**
 * Provide the authentication feature.
 *
 * Registers auth services, token refresh, and session management.
 * Compose with `withOAuth()`, `withMfa()`, or `withSessionTimeout()`.
 *
 * @returns Environment providers for authentication
 *
 * @example
 * ```typescript
 * providers: [
 *   provideAuth(
 *     withOAuth({ clientId: 'abc', issuer: 'https://auth.example.com' }),
 *     withSessionTimeout(30 * 60_000)
 *   )
 * ]
 * ```
 *
 * @since 2.0.0
 */
export function provideAuth(...features: Provider[][]): EnvironmentProviders {
    return makeEnvironmentProviders([...features.flat()]);
}

/**
 * Enable OAuth 2.0 / OpenID Connect authentication.
 *
 * @param config - OAuth configuration with client ID and issuer URL
 * @returns Provider array
 */
export function withOAuth(config: { clientId: string; issuer: string }): Provider[] {
    return [
        { provide: 'OAUTH_CLIENT_ID', useValue: config.clientId },
        { provide: 'OAUTH_ISSUER', useValue: config.issuer },
    ];
}

/**
 * Enable multi-factor authentication support.
 *
 * @param methods - Allowed MFA methods
 * @returns Provider array
 *
 * @beta
 */
export function withMfa(methods: ('totp' | 'sms' | 'email')[] = ['totp']): Provider[] {
    return [{ provide: 'MFA_METHODS', useValue: methods }];
}

/**
 * Configure automatic session timeout.
 *
 * @param timeoutMs - Session timeout in milliseconds (default 30 minutes)
 * @returns Provider array
 */
export function withSessionTimeout(timeoutMs: number = 30 * 60_000): Provider[] {
    return [{ provide: 'SESSION_TIMEOUT', useValue: timeoutMs }];
}

// ─── Analytics Feature ──────────────────────────────────────────

/**
 * Provide analytics and telemetry tracking.
 *
 * @param trackingId - The analytics tracking ID (e.g. GA4 measurement ID)
 * @returns Environment providers
 *
 * @example
 * ```typescript
 * providers: [provideAnalytics('G-XXXXXXXXXX', withConsentManager())]
 * ```
 *
 * @since 2.1.0
 */
export function provideAnalytics(
    trackingId: string,
    ...features: Provider[][]
): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: 'ANALYTICS_ID', useValue: trackingId },
        ...features.flat(),
    ]);
}

/**
 * Enable GDPR-compliant consent management for analytics.
 *
 * @returns Provider array
 */
export function withConsentManager(): Provider[] {
    return [{ provide: 'CONSENT_MANAGER_ENABLED', useValue: true }];
}

/**
 * Enable custom event tracking dimensions.
 *
 * @param dimensions - Custom dimension key-value pairs
 * @returns Provider array
 */
export function withCustomDimensions(dimensions: Record<string, string>): Provider[] {
    return [{ provide: 'ANALYTICS_DIMENSIONS', useValue: dimensions }];
}

// ─── Logging Feature ────────────────────────────────────────────

/**
 * Provide structured logging infrastructure.
 *
 * Configures log level, transports, and error reporting.
 *
 * @param level - Minimum log level
 * @returns Environment providers
 *
 * @since 2.0.0
 */
export function provideLogging(
    level: 'debug' | 'info' | 'warn' | 'error' = 'info'
): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: 'LOG_LEVEL', useValue: level }]);
}

/**
 * Enable remote error reporting (e.g. Sentry, Datadog).
 *
 * @param dsn - The error reporting service DSN
 * @returns Provider array
 */
export function withErrorReporting(dsn: string): Provider[] {
    return [{ provide: 'ERROR_REPORTING_DSN', useValue: dsn }];
}

// ─── Feature Flags ──────────────────────────────────────────────

/**
 * Provide the feature flag system.
 *
 * Supports static flags, remote flag sources, and A/B testing.
 *
 * @param flags - Static feature flag defaults
 * @returns Environment providers
 *
 * @example
 * ```typescript
 * providers: [
 *   provideFeatureFlags(
 *     { newDashboard: true, darkMode: false },
 *     withRemoteFlags('https://flags.example.com/api')
 *   )
 * ]
 * ```
 *
 * @since 2.0.0
 */
export function provideFeatureFlags(
    flags: Record<string, boolean>,
    ...features: Provider[][]
): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: 'FEATURE_FLAGS_DEFAULTS', useValue: flags },
        ...features.flat(),
    ]);
}

/**
 * Enable remote feature flag fetching.
 *
 * @param endpoint - Feature flag API endpoint
 * @param pollInterval - Polling interval in ms (default 5 minutes)
 * @returns Provider array
 */
export function withRemoteFlags(endpoint: string, pollInterval: number = 300_000): Provider[] {
    return [
        { provide: 'FEATURE_FLAGS_ENDPOINT', useValue: endpoint },
        { provide: 'FEATURE_FLAGS_POLL_INTERVAL', useValue: pollInterval },
    ];
}

// ─── i18n Feature ───────────────────────────────────────────────

/**
 * Provide internationalization support.
 *
 * @param defaultLocale - Default locale code (e.g. 'en-US')
 * @param supportedLocales - List of supported locale codes
 * @returns Environment providers
 *
 * @since 2.0.0
 */
export function provideI18n(
    defaultLocale: string = 'en-US',
    supportedLocales: string[] = ['en-US']
): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: 'I18N_DEFAULT_LOCALE', useValue: defaultLocale },
        { provide: 'I18N_SUPPORTED_LOCALES', useValue: supportedLocales },
    ]);
}

// ─── Notification Feature ───────────────────────────────────────

/**
 * Provide the notification/toast system.
 *
 * @param maxVisible - Maximum visible notifications (default 5)
 * @returns Environment providers
 *
 * @since 2.1.0
 */
export function provideNotifications(maxVisible: number = 5): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: 'NOTIFICATION_MAX_VISIBLE', useValue: maxVisible },
    ]);
}

// ─── Utilities ──────────────────────────────────────────────────

/**
 * Factory function for creating a default user object.
 *
 * @returns A default user with guest role
 */
export function createDefaultUser() {
    return { id: 0, username: 'guest', email: '', role: 'guest' };
}

/**
 * Injection function for accessing the user count signal.
 *
 * @returns A read-only signal of the user count
 */
export function injectUserCount() {
    return signal(0).asReadonly();
}
