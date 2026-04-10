/**
 * User role.
 */
export enum UserRole {
    Admin = 'admin',
    Editor = 'editor',
    Viewer = 'viewer',
    /** @beta */
    Guest = 'guest',
}

/**
 * A user entity.
 */
export interface User {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    displayName?: string;
    avatarUrl?: string;
}

/**
 * Paginated response.
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

/**
 * A user or just a reference.
 */
export type UserOrRef = User | Pick<User, 'id' | 'username'>;
