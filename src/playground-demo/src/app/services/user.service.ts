import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { User } from '../interfaces/user.interface';
import { UserStatus } from '../enums/user-status.enum';

/**
 * Configuration options for user search
 */
export interface UserSearchOptions {
  /** Search query string */
  query?: string;
  /** Filter by user status */
  status?: UserStatus;
  /** Page number for pagination */
  page?: number;
  /** Number of results per page */
  limit?: number;
  /** Sort field */
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response for user searches
 */
export interface UserSearchResponse {
  /** Array of users */
  users: User[];
  /** Total number of users matching the criteria */
  total: number;
  /** Current page number */
  page: number;
  /** Number of results per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Service for managing user data and operations.
 *
 * This service provides methods for CRUD operations on user entities,
 * user authentication, and user preference management.
 *
 * @example
 * ```typescript
 * constructor(private userService: UserService) {}
 *
 * ngOnInit() {
 *   this.userService.getCurrentUser().subscribe(user => {
 *     console.log('Current user:', user);
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {

  /** Base API URL for user endpoints */
  private readonly apiUrl = '/api/users';

  /** Subject for the currently authenticated user */
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  /** Observable for the currently authenticated user */
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  /**
   * Creates an instance of UserService.
   *
   * @param http - Angular HTTP client for making API calls
   */
  constructor(private http: HttpClient) {
    this.initializeCurrentUser();
  }

  /**
   * Initialize the current user from local storage or session
   *
   * @private
   */
  private initializeCurrentUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  /**
   * Get the currently authenticated user
   *
   * @returns Observable of the current user or null if not authenticated
   */
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Retrieve a user by their unique identifier
   *
   * @param id - The unique identifier of the user
   * @returns Observable containing the user data
   *
   * @example
   * ```typescript
   * this.userService.getUserById('123').subscribe(
   *   user => console.log('User found:', user),
   *   error => console.error('User not found:', error)
   * );
   * ```
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<User>('getUserById'))
      );
  }

  /**
   * Search for users based on various criteria
   *
   * @param options - Search options including query, filters, and pagination
   * @returns Observable containing paginated search results
   *
   * @example
   * ```typescript
   * const searchOptions: UserSearchOptions = {
   *   query: 'john',
   *   status: UserStatus.ACTIVE,
   *   page: 1,
   *   limit: 10
   * };
   *
   * this.userService.searchUsers(searchOptions).subscribe(
   *   response => console.log('Search results:', response.users)
   * );
   * ```
   */
  searchUsers(options: UserSearchOptions = {}): Observable<UserSearchResponse> {
    let params = new HttpParams();

    Object.keys(options).forEach(key => {
      const value = options[key as keyof UserSearchOptions];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<UserSearchResponse>(`${this.apiUrl}/search`, { params })
      .pipe(
        catchError(this.handleError<UserSearchResponse>('searchUsers'))
      );
  }

  /**
   * Create a new user account
   *
   * @param userData - Partial user data for creating a new user
   * @returns Observable containing the created user
   *
   * @example
   * ```typescript
   * const newUser = {
   *   email: 'jane@example.com',
   *   firstName: 'Jane',
   *   lastName: 'Smith',
   *   status: UserStatus.PENDING_VERIFICATION
   * };
   *
   * this.userService.createUser(newUser).subscribe(
   *   user => console.log('User created:', user)
   * );
   * ```
   */
  createUser(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData)
      .pipe(
        tap(user => console.log('User created successfully:', user.id)),
        catchError(this.handleError<User>('createUser'))
      );
  }

  /**
   * Update an existing user's information
   *
   * @param id - The unique identifier of the user to update
   * @param userData - Partial user data containing the fields to update
   * @returns Observable containing the updated user
   *
   * @example
   * ```typescript
   * const updates = {
   *   firstName: 'John Updated',
   *   preferences: {
   *     theme: 'dark',
   *     language: 'en'
   *   }
   * };
   *
   * this.userService.updateUser('123', updates).subscribe(
   *   user => console.log('User updated:', user)
   * );
   * ```
   */
  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData)
      .pipe(
        tap(user => {
          // Update current user if it's the same user being updated
          const currentUser = this.currentUserSubject.value;
          if (currentUser && currentUser.id === user.id) {
            this.setCurrentUser(user);
          }
        }),
        catchError(this.handleError<User>('updateUser'))
      );
  }

  /**
   * Delete a user account
   *
   * @param id - The unique identifier of the user to delete
   * @returns Observable that completes when the user is deleted
   *
   * @example
   * ```typescript
   * this.userService.deleteUser('123').subscribe(
   *   () => console.log('User deleted successfully'),
   *   error => console.error('Error deleting user:', error)
   * );
   * ```
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          // Clear current user if it's the same user being deleted
          const currentUser = this.currentUserSubject.value;
          if (currentUser && currentUser.id === id) {
            this.clearCurrentUser();
          }
        }),
        catchError(this.handleError<void>('deleteUser'))
      );
  }

  /**
   * Change a user's status
   *
   * @param id - The unique identifier of the user
   * @param status - The new status to set
   * @returns Observable containing the updated user
   *
   * @example
   * ```typescript
   * this.userService.changeUserStatus('123', UserStatus.SUSPENDED).subscribe(
   *   user => console.log('User status changed:', user.status)
   * );
   * ```
   */
  changeUserStatus(id: string, status: UserStatus): Observable<User> {
    return this.updateUser(id, { status });
  }

  /**
   * Set the current authenticated user
   *
   * @param user - The user to set as current
   */
  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  /**
   * Clear the current authenticated user
   */
  clearCurrentUser(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  /**
   * Check if a user is currently authenticated
   *
   * @returns True if a user is authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Get all users with a specific status
   *
   * @param status - The status to filter by
   * @returns Observable containing array of users with the specified status
   */
  getUsersByStatus(status: UserStatus): Observable<User[]> {
    return this.searchUsers({ status }).pipe(
      map(response => response.users)
    );
  }

  /**
   * Generic error handler for HTTP operations
   *
   * @param operation - Name of the operation that failed
   * @returns Function that handles the error
   *
   * @private
   */
  private handleError<T>(operation = 'operation') {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);

      // Let the app keep running by returning an empty result
      return throwError(() => new Error(`${operation} failed: ${error.message || error}`));
    };
  }
}
