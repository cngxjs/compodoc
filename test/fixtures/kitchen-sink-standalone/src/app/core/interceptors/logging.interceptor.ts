import { HttpInterceptorFn } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';

/**
 * Functional HTTP interceptor for request/response logging.
 *
 * Logs method, URL, and duration of each HTTP call.
 *
 * @since 2.0.0
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
    const startTime = Date.now();

    return next(req).pipe(
        finalize(() => {
            const duration = Date.now() - startTime;
            console.log(`[HTTP] ${req.method} ${req.url} (${duration}ms)`);
        })
    );
};
