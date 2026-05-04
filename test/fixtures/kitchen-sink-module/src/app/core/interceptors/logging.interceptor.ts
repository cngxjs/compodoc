import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';

/**
 * HTTP interceptor that logs request/response timing.
 *
 * Logs the method, URL, status, and duration of each HTTP call.
 *
 * @since 1.0.0
 */
@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
    /**
     * Intercept and log HTTP request timing.
     *
     * @param req - The outgoing HTTP request
     * @param next - The next handler in the chain
     * @returns Observable of the HTTP event stream
     */
    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const startTime = Date.now();
        let status: string;

        return next.handle(req).pipe(
            tap({
                next: (event) => {
                    if (event instanceof HttpResponse) {
                        status = 'succeeded';
                    }
                },
                error: () => (status = 'failed'),
            }),
            finalize(() => {
                const elapsed = Date.now() - startTime;
                console.log(`[HTTP] ${req.method} ${req.url} ${status} in ${elapsed}ms`);
            })
        );
    }
}
