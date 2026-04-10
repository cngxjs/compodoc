/**
 * Pi constant.
 */
export const PI = 3.14159265358979;

/**
 * Golden ratio.
 * @since 2.0.0
 */
export const GOLDEN_RATIO = 1.61803398874989;

/**
 * Default page size.
 */
export const DEFAULT_PAGE_SIZE = 25;

/**
 * Supported locales.
 */
export const SUPPORTED_LOCALES = ['en-US', 'de-DE', 'fr-FR', 'es-ES', 'ja-JP'] as const;

/**
 * Locale type.
 */
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Responsive breakpoints.
 */
export const BREAKPOINTS = {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
} as const;

/**
 * HTTP status codes.
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    SERVER_ERROR: 500,
} as const;

/**
 * @deprecated Use InjectionToken config instead.
 */
export const ENVIRONMENT = {
    production: false,
    apiUrl: '/api',
    version: '2.0.0',
};
