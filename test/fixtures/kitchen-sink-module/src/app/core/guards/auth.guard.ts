import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

/**
 * Guard that protects routes requiring authentication.
 *
 * Redirects unauthenticated users to the login page.
 * Implements both `CanActivate` and `CanActivateChild`.
 *
 * @example
 * ```typescript
 * { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] }
 * ```
 *
 * @since 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
    constructor(private router: Router) {}

    /**
     * Check if the user can activate the route.
     *
     * @param route - The activated route snapshot
     * @param state - The router state snapshot
     * @returns True if authenticated, or a UrlTree to redirect
     */
    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.checkAuth(state.url);
    }

    /**
     * Check if child routes can be activated.
     */
    canActivateChild(
        childRoute: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.canActivate(childRoute, state);
    }

    /**
     * Core auth check logic.
     * @internal
     */
    private checkAuth(url: string): boolean | UrlTree {
        const isAuthenticated = !!localStorage.getItem('auth-token');
        if (isAuthenticated) return true;
        return this.router.createUrlTree(['/login'], {
            queryParams: { returnUrl: url },
        });
    }
}
