import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { retry } from 'rxjs/operators';
import { MAX_RETRIES } from '../tokens/retry.tokens';

/**
 * Functional HTTP interceptor that retries failed requests.
 *
 * Uses the MAX_RETRIES token to configure retry count.
 *
 * @since 2.0.0
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
    const maxRetries = inject(MAX_RETRIES);
    return next(req).pipe(retry(maxRetries));
};
