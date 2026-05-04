/**
 * User role within the application.
 */
export enum UserRole {
    Admin = 'admin',
    Editor = 'editor',
    Viewer = 'viewer',
    /**
     * Guest role with read-only access.
     * @beta
     */
    Guest = 'guest',
}

/**
 * Represents a user in the system.
 *
 * @example
 * ```typescript
 * const user: User = {
 *   id: 42,
 *   username: 'johndoe',
 *   email: 'john@example.com',
 *   role: UserRole.Editor,
 * };
 * ```
 */
export interface User {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    /** Full display name */
    displayName?: string;
    /** URL to avatar image */
    avatarUrl?: string;
    /** When the user was created */
    createdAt?: Date;
    /** Whether the user has verified their email */
    emailVerified?: boolean;
}

/**
 * Credentials for authentication.
 */
export interface AuthCredentials {
    username: string;
    password: string;
    /** Optional two-factor code */
    twoFactorCode?: string;
}

/**
 * The result of an authentication attempt.
 */
export interface AuthResult {
    success: boolean;
    token?: string;
    user?: User;
    error?: string;
    expiresAt?: Date;
}

/**
 * User preferences stored in the profile.
 */
export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: NotificationPreferences;
}

/**
 * Granular notification preferences.
 */
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    sms: boolean;
    digest: 'daily' | 'weekly' | 'none';
}

/**
 * A type that can be either a full User or just a reference.
 */
export type UserOrRef = User | { id: number; username: string };

/**
 * Pagination parameters.
 */
export interface PaginationParams {
    page: number;
    pageSize: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
