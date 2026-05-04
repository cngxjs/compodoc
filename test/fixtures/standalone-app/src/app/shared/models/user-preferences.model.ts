/**
 * User role levels for access control.
 * @since 1.0.0
 */
export enum UserRole {
    /** Standard user with limited access */
    Guest = 'guest',
    /** Authenticated user */
    Member = 'member',
    /** Full administrative access */
    Admin = 'admin',
    /**
     * Legacy super-admin role
     * @deprecated Use `Admin` with feature flags instead
     */
    SuperAdmin = 'superadmin',
}

/**
 * Theme options for the application.
 * @since 1.0.0
 */
export enum Theme {
    Light = 'light',
    Dark = 'dark',
    /** @deprecated Use system preference detection instead */
    Auto = 'auto',
}

/**
 * User display preferences stored in localStorage.
 * @since 1.0.0
 */
export type UserPreferences = {
    theme: Theme;
    locale: string;
    pageSize: number;
};

/**
 * Serialization format for API export.
 * @deprecated Use the new `ExportConfig` interface instead.
 */
export type LegacyExportFormat = 'csv' | 'xml' | 'json';

/**
 * Notification delivery channel.
 * @since 2.0.0
 */
export type NotificationChannel = 'email' | 'push' | 'sms';
