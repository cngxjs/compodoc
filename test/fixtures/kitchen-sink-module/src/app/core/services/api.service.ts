import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

import { PaginatedResponse, PaginationParams } from '../models/user.model';
import { API_BASE_URL, FEATURE_FLAGS } from '../tokens/api.tokens';
import { Inject } from '@angular/core';

/**
 * Base API service for making HTTP requests.
 *
 * Wraps `HttpClient` with error handling, retry logic,
 * and pagination support.
 *
 * @example
 * ```typescript
 * class UserService {
 *   constructor(private api: ApiService) {}
 *   getUsers() { return this.api.get<User[]>('/users'); }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class ApiService {
    constructor(
        private http: HttpClient,
        @Inject(API_BASE_URL) private baseUrl: string,
        @Inject(FEATURE_FLAGS) private featureFlags: Record<string, boolean>
    ) {}

    /**
     * Perform a GET request.
     *
     * @param path - API endpoint path
     * @param params - Optional query parameters
     * @returns Observable of the response body
     */
    get<T>(path: string, params?: Record<string, string>): Observable<T> {
        let httpParams = new HttpParams();
        if (params) {
            Object.entries(params).forEach(([k, v]) => (httpParams = httpParams.set(k, v)));
        }
        return this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams }).pipe(
            retry(2),
            catchError(this.handleError)
        );
    }

    /**
     * Perform a POST request.
     *
     * @param path - API endpoint path
     * @param body - Request body
     * @returns Observable of the response body
     */
    post<T>(path: string, body: unknown): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}${path}`, body).pipe(catchError(this.handleError));
    }

    /**
     * Perform a PUT request.
     *
     * @param path - API endpoint path
     * @param body - Request body
     * @returns Observable of the response body
     */
    put<T>(path: string, body: unknown): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}${path}`, body).pipe(catchError(this.handleError));
    }

    /**
     * Perform a PATCH request.
     *
     * @param path - API endpoint path
     * @param body - Partial request body
     * @returns Observable of the response body
     */
    patch<T>(path: string, body: unknown): Observable<T> {
        return this.http.patch<T>(`${this.baseUrl}${path}`, body).pipe(catchError(this.handleError));
    }

    /**
     * Perform a DELETE request.
     *
     * @param path - API endpoint path
     * @returns Observable of the response body
     */
    delete<T>(path: string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}${path}`).pipe(catchError(this.handleError));
    }

    /**
     * Perform a paginated GET request.
     *
     * @param path - API endpoint path
     * @param pagination - Pagination parameters
     * @returns Observable of paginated response
     */
    getPaginated<T>(path: string, pagination: PaginationParams): Observable<PaginatedResponse<T>> {
        const params: Record<string, string> = {
            page: String(pagination.page),
            pageSize: String(pagination.pageSize),
        };
        if (pagination.sortBy) params['sortBy'] = pagination.sortBy;
        if (pagination.sortDir) params['sortDir'] = pagination.sortDir;
        return this.get<PaginatedResponse<T>>(path, params);
    }

    /**
     * Check whether a feature flag is enabled.
     *
     * @param flag - The feature flag name
     * @returns True if the flag is enabled
     */
    isFeatureEnabled(flag: string): boolean {
        return this.featureFlags[flag] ?? false;
    }

    /**
     * Handle HTTP errors.
     * @internal
     */
    private handleError(error: unknown): Observable<never> {
        console.error('API Error:', error);
        return throwError(() => error);
    }
}
