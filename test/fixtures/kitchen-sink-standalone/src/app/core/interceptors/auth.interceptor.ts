import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Functional HTTP interceptor that attaches Bearer tokens.
 *
 * @example
 * ```typescript
 * provideHttpClient(withInterceptors([authInterceptor]))
 * ```
 *
 * @since 2.0.0
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('auth-token');

    if (token) {
        const cloned = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
        });
        return next(cloned);
    }

    return next(req);
};
