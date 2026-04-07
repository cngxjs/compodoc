import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Adds authorization header to outgoing requests.
 *
 * @since 1.0.0
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = 'mock-token';
    const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next(cloned);
};
