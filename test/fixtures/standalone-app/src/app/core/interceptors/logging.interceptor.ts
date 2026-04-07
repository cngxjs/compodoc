import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Logs HTTP requests and responses for debugging.
 *
 * @since 1.1.0
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    return next(req);
};
