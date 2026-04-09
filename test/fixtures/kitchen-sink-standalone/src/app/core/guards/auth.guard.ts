import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Functional guard that checks authentication status.
 *
 * Redirects to `/login` if the user is not authenticated.
 *
 * @example
 * ```typescript
 * { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent }
 * ```
 *
 * @since 2.0.0
 */
export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const isAuthenticated = !!localStorage.getItem('auth-token');

    if (isAuthenticated) return true;

    return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
    });
};
