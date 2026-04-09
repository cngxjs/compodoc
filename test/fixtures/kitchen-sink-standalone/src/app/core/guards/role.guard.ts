import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Functional guard that checks user role permissions.
 *
 * Reads required roles from `route.data['roles']`.
 *
 * @example
 * ```typescript
 * { path: 'admin', canActivate: [roleGuard], data: { roles: ['admin'] } }
 * ```
 *
 * @since 2.0.0
 */
export const roleGuard: CanActivateFn = (route) => {
    const router = inject(Router);
    const requiredRoles: string[] = route.data['roles'] ?? [];
    const userRole = localStorage.getItem('user-role');

    if (!userRole || !requiredRoles.includes(userRole)) {
        return router.createUrlTree(['/unauthorized']);
    }

    return true;
};
