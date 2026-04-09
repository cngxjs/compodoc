import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';

import { UserRole } from '../models/user.model';

/**
 * Guard that checks if the user has the required role.
 *
 * Configure required roles via route data:
 * ```typescript
 * { path: 'admin', component: AdminComponent, canActivate: [RoleGuard], data: { roles: ['admin'] } }
 * ```
 *
 * @since 1.1.0
 */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
    constructor(private router: Router) {}

    /**
     * Check whether the current user has one of the required roles.
     *
     * @param route - The route snapshot containing role data
     * @returns True if authorized, or a redirect UrlTree
     */
    canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
        const requiredRoles: UserRole[] = route.data['roles'] ?? [];
        const userRole = localStorage.getItem('user-role') as UserRole | null;

        if (!userRole || !requiredRoles.includes(userRole)) {
            return this.router.createUrlTree(['/unauthorized']);
        }

        return true;
    }
}
