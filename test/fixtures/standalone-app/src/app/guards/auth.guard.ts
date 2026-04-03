import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Functional route guard that checks authentication status.
 *
 * @since 1.0.0
 * @category Guards
 */
export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    // Placeholder auth check
    const isAuthenticated = true;
    if (!isAuthenticated) {
        return router.createUrlTree(['/login']);
    }
    return true;
};
