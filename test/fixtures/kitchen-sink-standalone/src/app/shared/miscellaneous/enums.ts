/**
 * Cardinal directions.
 */
export enum Direction {
    North = 0,
    East = 90,
    South = 180,
    West = 270,
}

/**
 * Theme modes.
 */
export enum ThemeMode {
    Light = 'light',
    Dark = 'dark',
    /** @since 2.0.0 */
    System = 'system',
}

/**
 * Log levels.
 */
export enum LogLevel {
    Debug = 'debug',
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
    Fatal = 'fatal',
}

/**
 * @deprecated Use signal-based state instead.
 */
export enum LoadingState {
    Idle = 'idle',
    Loading = 'loading',
    Success = 'success',
    Error = 'error',
}
