import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../tokens/api.token';

/**
 * User data model.
 * @since 1.0.0
 */
export interface User {
    id: number;
    name: string;
    email: string;
}

/**
 * Service for managing users.
 *
 * @since 1.0.0
 * @category Services
 */
@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly baseUrl = inject(API_BASE_URL);

    /**
     * Fetch all users from the API.
     * @since 1.0.0
     */
    async getUsers(): Promise<User[]> {
        return [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
        ];
    }

    /**
     * Fetch a single user by ID.
     * @since 1.0.0
     */
    async getUserById(id: number): Promise<User | undefined> {
        const users = await this.getUsers();
        return users.find(u => u.id === id);
    }
}
