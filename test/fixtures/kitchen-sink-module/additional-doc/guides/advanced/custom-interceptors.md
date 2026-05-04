# Custom Interceptors

Learn how to build and chain HTTP interceptors.

## Interceptor Interface

Every interceptor implements `HttpInterceptor`:

```typescript
@Injectable()
export class MyInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // Modify request or response
        return next.handle(req);
    }
}
```

## Registration Order

Interceptors execute in the order they are registered:

| Order | Interceptor | Purpose |
|-|-|-|
| 1 | `LoggingInterceptor` | Request/response timing |
| 2 | `AuthInterceptor` | Bearer token attachment |
| 3 | `CacheInterceptor` | GET response caching |

> **Important:** The cache interceptor only caches `GET` requests. All other methods pass through unchanged.

## Creating a Retry Interceptor

```typescript
@Injectable()
export class RetryInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<unknown>, next: HttpHandler) {
        return next.handle(req).pipe(
            retry({ count: 3, delay: 1000 }),
            catchError(err => {
                console.error(`Request failed after 3 retries: ${req.url}`);
                return throwError(() => err);
            })
        );
    }
}
```

## Testing Interceptors

Use `HttpClientTestingModule`:

```typescript
describe('AuthInterceptor', () => {
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
            ],
        });
    });

    it('should add Authorization header', () => {
        localStorage.setItem('auth-token', 'test-token');
        http.get('/api/test').subscribe();
        const req = httpMock.expectOne('/api/test');
        expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    });
});
```
