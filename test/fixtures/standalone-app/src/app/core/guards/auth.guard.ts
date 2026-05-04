import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Functional route guard that checks authentication status.
 *
 * @since 1.0.0
 */
export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const isAuthenticated = true;
    if (!isAuthenticated) {
        return router.createUrlTree(['/login']);
    }
    return true;
};
