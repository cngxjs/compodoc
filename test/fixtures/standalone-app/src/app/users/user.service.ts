import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../../core/tokens/api.token';

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
 * @category Services
 *
 * @since 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class UserService {
    private readonly baseUrl = inject(API_BASE_URL);

    async getUsers(): Promise<User[]> {
        return [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
        ];
    }

    async getUserById(id: number): Promise<User | undefined> {
        const users = await this.getUsers();
        return users.find(u => u.id === id);
    }
}
