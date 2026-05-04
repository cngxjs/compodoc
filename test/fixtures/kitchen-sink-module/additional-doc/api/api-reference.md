# API Reference

Quick reference for the Kitchen Sink Module public API.

## Services

### TodoStore

| Property | Type | Description |
|-|-|-|
| `todos$` | `Observable<Todo[]>` | All todos stream |
| `count$` | `Observable<number>` | Todo count stream |
| `allCompleted` | `boolean` | Whether all are done |
| `storeName` | `string` | Store identifier |

### ApiService

| Method | Signature | Description |
|-|-|-|
| `get<T>` | `(path, params?) => Observable<T>` | GET with query params |
| `post<T>` | `(path, body) => Observable<T>` | POST |
| `put<T>` | `(path, body) => Observable<T>` | PUT |
| `patch<T>` | `(path, body) => Observable<T>` | PATCH |
| `delete<T>` | `(path) => Observable<T>` | DELETE |
| `getPaginated<T>` | `(path, pagination) => Observable<PaginatedResponse<T>>` | Paginated GET |

### CacheService

| Method | Signature | Description |
|-|-|-|
| `set<T>` | `(key, value, config?) => void` | Store value |
| `get<T>` | `(key) => T \| undefined` | Retrieve value |
| `has` | `(key) => boolean` | Check existence |
| `delete` | `(key) => boolean` | Remove entry |
| `clear` | `() => void` | Clear all |

## Tokens

| Token | Type | Default | Description |
|-|-|-|-|
| `API_BASE_URL` | `string` | `'/api'` | Base URL for API calls |
| `FEATURE_FLAGS` | `Record<string, boolean>` | `{}` | Feature toggles |
| `APP_VERSION` | `string` | — | Application version |
| `MAX_RETRIES` | `number` | `3` | HTTP retry count |
| `DEFAULT_PAGE_SIZE` | `number` | `25` | Pagination default |
| `LOGGER_FN` | `(msg: string) => void` | — | Custom logger *(deprecated)* |

## Enums

### TodoPriority

| Value | Description |
|-|-|
| `Low` | Lowest urgency |
| `Medium` | Normal urgency |
| `High` | Highest urgency |
| ~~`Critical`~~ | *Deprecated* — use High with due date |

### UserRole

| Value | Description |
|-|-|
| `Admin` | Full access |
| `Editor` | Read/write |
| `Viewer` | Read-only |
| `Guest` | Limited read *(beta)* |
