import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { CacheService } from '../services/cache.service';

/**
 * HTTP interceptor that caches GET responses.
 *
 * Only caches GET requests. Cache is managed by {@link CacheService}.
 *
 * @since 1.1.0
 * @beta
 */
@Injectable()
export class CacheInterceptor implements HttpInterceptor {
    constructor(private cache: CacheService) {}

    /**
     * Intercept GET requests and serve cached responses when available.
     *
     * @param req - The outgoing HTTP request
     * @param next - The next handler in the chain
     * @returns Observable of the HTTP event stream
     */
    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (req.method !== 'GET') {
            return next.handle(req);
        }

        const cachedResponse = this.cache.get<HttpResponse<unknown>>(req.url);
        if (cachedResponse) {
            return of(cachedResponse);
        }

        return next.handle(req).pipe(
            tap((event) => {
                if (event instanceof HttpResponse) {
                    this.cache.set(req.url, event, { ttl: 60_000 });
                }
            })
        );
    }
}
