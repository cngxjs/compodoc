import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * HTTP interceptor that attaches an authentication token to outgoing requests.
 *
 * Reads the token from localStorage and sets it as a Bearer token
 * in the Authorization header.
 *
 * @example
 * ```typescript
 * providers: [
 *   { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
 * ]
 * ```
 *
 * @since 1.0.0
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    /**
     * Intercept HTTP requests and attach the auth token.
     *
     * @param req - The outgoing HTTP request
     * @param next - The next handler in the chain
     * @returns An observable of the HTTP event stream
     */
    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = localStorage.getItem('auth-token');
        if (token) {
            const cloned = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` },
            });
            return next.handle(cloned);
        }
        return next.handle(req);
    }
}
