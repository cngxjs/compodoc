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
 * @github https://github.com/cngxjs/compodocx/blob/develop/test/fixtures/kitchen-sink-standalone/src/app/core/interceptors/auth.interceptor.ts
 * @docs https://cngx.dev/interceptors/auth
 * @stackblitz https://stackblitz.com/edit/angular-auth-interceptor
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
