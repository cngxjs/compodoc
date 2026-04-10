import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api.tokens';

/**
 * Lightweight API service using `inject()`.
 *
 * @since 2.0.0
 * @github https://github.com/cngxjs/compodocx/blob/develop/test/fixtures/kitchen-sink-standalone/src/app/core/services/api.service.ts
 * @docs https://cngx.dev/services/api
 * @stackblitz https://stackblitz.com/edit/angular-api-service-demo
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    /**
     * GET request.
     */
    get<T>(path: string): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}${path}`);
    }

    /**
     * POST request.
     */
    post<T>(path: string, body: unknown): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}${path}`, body);
    }

    /**
     * PATCH request.
     */
    patch<T>(path: string, body: unknown): Observable<T> {
        return this.http.patch<T>(`${this.baseUrl}${path}`, body);
    }

    /**
     * DELETE request.
     */
    delete<T>(path: string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}${path}`);
    }
}
