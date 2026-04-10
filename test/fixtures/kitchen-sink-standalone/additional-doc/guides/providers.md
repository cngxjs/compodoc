# Functional Providers

Modern Angular uses functions instead of NgModules for configuration.

## The `provide*` Pattern

```typescript
export function provideUserFeature(): EnvironmentProviders {
    return makeEnvironmentProviders([
        UserService,
        { provide: USER_CONFIG, useValue: defaultConfig },
    ]);
}
```

## The `with*` Pattern

```typescript
export function withCaching(ttl: number): Provider[] {
    return [{ provide: 'CACHE_TTL', useValue: ttl }];
}
```

## Usage in ApplicationConfig

```typescript
export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
        provideHttpClient(withInterceptors([authInterceptor, loggingInterceptor])),
        provideAnimationsAsync(),
        provideUserFeature(),
    ],
};
```

## Built-in Provider Functions

| Function | Purpose |
|-|-|
| `provideRouter()` | Configure routing |
| `provideHttpClient()` | Configure HTTP |
| `provideAnimationsAsync()` | Async animation support |
| `withComponentInputBinding()` | Bind route params to inputs |
| `withViewTransitions()` | Enable view transitions API |
| `withInterceptors()` | Register functional interceptors |

## Factory Functions

```typescript
export function createDefaultUser() {
    return { id: 0, username: 'guest', email: '', role: 'guest' };
}
```

## Injection Functions

```typescript
export function injectUserCount() {
    return inject(UserService).count;
}
```
