/**
 * Mathematical constants used throughout the application.
 */

/**
 * The ratio of a circle's circumference to its diameter.
 *
 * @example
 * ```typescript
 * const circumference = 2 * PI * radius;
 * ```
 */
export const PI = 3.14159265358979;

/**
 * Euler's number.
 */
export const E = 2.71828182845904;

/**
 * The golden ratio.
 *
 * @since 1.0.0
 */
export const GOLDEN_RATIO = 1.61803398874989;

/**
 * Default pagination page size.
 */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Maximum number of items in a single batch operation.
 */
export const MAX_BATCH_SIZE = 100;

/**
 * Supported locale codes.
 */
export const SUPPORTED_LOCALES = ['en-US', 'de-DE', 'fr-FR', 'es-ES', 'ja-JP'] as const;

/**
 * Type for a supported locale code.
 */
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Application-wide breakpoints for responsive design.
 */
export const BREAKPOINTS = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
} as const;

/**
 * The application environment configuration.
 *
 * @deprecated Use `InjectionToken` configuration instead.
 */
export const ENVIRONMENT = {
    production: false,
    apiUrl: '/api',
    version: '1.0.0',
};

/**
 * HTTP status codes used in the application.
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;
