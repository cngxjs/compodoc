/**
 * Cardinal directions.
 *
 * @example
 * ```typescript
 * const heading = Direction.North;
 * ```
 */
export enum Direction {
    /** Points up (0 degrees) */
    North = 0,
    /** Points right (90 degrees) */
    East = 90,
    /** Points down (180 degrees) */
    South = 180,
    /** Points left (270 degrees) */
    West = 270,
}

/**
 * HTTP request methods.
 */
export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
    HEAD = 'HEAD',
    OPTIONS = 'OPTIONS',
}

/**
 * Theme mode options.
 */
export enum ThemeMode {
    Light = 'light',
    Dark = 'dark',
    /**
     * Follow the system preference.
     * @since 1.2.0
     */
    System = 'system',
}

/**
 * Permission levels.
 *
 * @deprecated Use fine-grained permission tokens instead.
 */
export enum PermissionLevel {
    /** No access */
    None = 0,
    /** Read-only */
    Read = 1,
    /** Read and write */
    Write = 2,
    /** Full administrative access */
    Admin = 3,
}

/**
 * String enum for log levels.
 */
export enum LogLevel {
    Debug = 'debug',
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
    Fatal = 'fatal',
}

/**
 * Numeric enum for sort order.
 */
export const enum SortOrder {
    Ascending = 1,
    Descending = -1,
    None = 0,
}
