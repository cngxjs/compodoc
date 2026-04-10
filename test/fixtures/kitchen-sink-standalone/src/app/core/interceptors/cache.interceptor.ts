import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

/**
 * Simple in-memory cache for GET requests.
 * @internal
 */
const cache = new Map<string, HttpResponse<unknown>>();

/**
 * Functional HTTP interceptor that caches GET responses.
 *
 * @since 2.0.0
 * @beta
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
    if (req.method !== 'GET') return next(req);

    const cached = cache.get(req.url);
    if (cached) return of(cached);

    return next(req).pipe(
        tap((event) => {
            if (event instanceof HttpResponse) {
                cache.set(req.url, event);
            }
        })
    );
};
