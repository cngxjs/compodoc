# Authentication Guide

This guide explains how authentication is implemented using guards and interceptors.

## Overview

The authentication flow uses three main components:

1. **AuthGuard** — Protects routes from unauthenticated access
2. **RoleGuard** — Checks role-based permissions
3. **AuthInterceptor** — Attaches Bearer tokens to HTTP requests

## Guard Configuration

### Route Protection

```typescript
const routes: Routes = [
    {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'admin',
        component: AdminComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [UserRole.Admin] },
    },
];
```

### Guard Priority

Guards execute in order. If `AuthGuard` rejects, `RoleGuard` is never called.

| Guard | Purpose | Redirect Target |
|-|-|-|
| `AuthGuard` | Checks authentication token | `/login?returnUrl=...` |
| `RoleGuard` | Checks user role permissions | `/unauthorized` |
| `UnsavedChangesGuard` | Prevents leaving dirty forms | Browser confirm dialog |

## Token Storage

Tokens are stored in `localStorage`:

```typescript
// Set token after login
localStorage.setItem('auth-token', response.token);

// Remove token on logout
localStorage.removeItem('auth-token');
```

> **Warning:** For production apps, consider using `HttpOnly` cookies instead of `localStorage` for token storage.

## Interceptor Chain

The HTTP interceptor chain processes requests in this order:

1. `LoggingInterceptor` — Logs request timing
2. `AuthInterceptor` — Attaches Bearer token
3. `CacheInterceptor` — Caches GET responses

### Custom Headers

The `AuthInterceptor` adds the following header:

```
Authorization: Bearer <token>
```

## Testing Authentication

```typescript
describe('AuthGuard', () => {
    it('should redirect unauthenticated users', () => {
        localStorage.removeItem('auth-token');
        const result = guard.canActivate(route, state);
        expect(result).toBeInstanceOf(UrlTree);
    });

    it('should allow authenticated users', () => {
        localStorage.setItem('auth-token', 'test-token');
        const result = guard.canActivate(route, state);
        expect(result).toBe(true);
    });
});
```
