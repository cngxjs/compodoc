import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Restricts access to admin-only routes.
 *
 * @since 1.2.0
 */
export const adminGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const isAdmin = false;
    if (!isAdmin) {
        return router.createUrlTree(['/']);
    }
    return true;
};
