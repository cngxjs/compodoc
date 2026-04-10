# API Reference

## Services

| Service | Description |
|-|-|
| `TodoStore` | Signal-based reactive todo store |
| `ThemeService` | Theme management with signals |
| `ApiService` | Lightweight HTTP wrapper |

## Tokens

| Token | Type | Default | Description |
|-|-|-|-|
| `API_BASE_URL` | `string` | `'/api'` | Base API URL |
| `FEATURE_FLAGS` | `Record<string, boolean>` | `{ experimentalDashboard: false }` | Feature toggles |
| `APP_VERSION` | `string` | `'2.0.0'` | App version |
| `STORAGE_KEY` | `string` | `'kitchen-sink-standalone-todos'` | localStorage key |
| `MAX_RETRIES` | `number` | `3` | HTTP retry count |

## Guards

| Guard | Type | Purpose |
|-|-|-|
| `authGuard` | `CanActivateFn` | Authentication check |
| `roleGuard` | `CanActivateFn` | Role-based access |
| `unsavedChangesGuard` | `CanDeactivateFn` | Dirty form protection |
| `featureFlagGuard` | `CanActivateFn` | Feature flag gating |
| `featureFlagMatcher` | `CanMatchFn` | Feature flag route matching |

## Interceptors

| Interceptor | Purpose |
|-|-|
| `authInterceptor` | Attach Bearer token |
| `loggingInterceptor` | Log request timing |
| `cacheInterceptor` | Cache GET responses |
| `retryInterceptor` | Retry failed requests |
