import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User, UserRole, PaginatedResponse, PaginationParams } from '../../core/models/user.model';
import { ApiService } from '../../core/services/api.service';

/**
 * Service for user CRUD operations.
 *
 * @category Features
 * @since 1.0.0
 */
@Injectable()
export class UserService {
    constructor(private api: ApiService) {}

    /**
     * Get all users.
     */
    getUsers(): Observable<User[]> {
        return this.api.get<User[]>('/users');
    }

    /**
     * Get a single user by ID.
     *
     * @param id - The user ID
     */
    getUserById(id: number): Observable<User> {
        return this.api.get<User>(`/users/${id}`);
    }

    /**
     * Get paginated users.
     *
     * @param params - Pagination parameters
     */
    getUsersPaginated(params: PaginationParams): Observable<PaginatedResponse<User>> {
        return this.api.getPaginated<User>('/users', params);
    }

    /**
     * Create a new user.
     *
     * @param user - The user data (without ID)
     */
    createUser(user: Omit<User, 'id'>): Observable<User> {
        return this.api.post<User>('/users', user);
    }

    /**
     * Update a user.
     *
     * @param id - The user ID
     * @param changes - Partial changes
     */
    updateUser(id: number, changes: Partial<User>): Observable<User> {
        return this.api.patch<User>(`/users/${id}`, changes);
    }

    /**
     * Delete a user.
     *
     * @param id - The user ID
     */
    deleteUser(id: number): Observable<void> {
        return this.api.delete<void>(`/users/${id}`);
    }
}
