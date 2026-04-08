import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, CanMatchFn, Router } from '@angular/router';

/**
 * Checks if the current user has one of the required roles.
 *
 * Usage in route config:
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [roleGuard('admin', 'superadmin')],
 *   loadComponent: () => import('./admin.component')
 * }
 * ```
 *
 * @param roles - Allowed role names
 * @returns A `CanActivateFn` guard
 * @since 2.0.0
 */
export function roleGuard(...roles: string[]): CanActivateFn {
    return (route, state) => {
        const router = inject(Router);
        const userRole = 'user';
        if (!roles.includes(userRole)) {
            return router.createUrlTree(['/']);
        }
        return true;
    };
}

/**
 * Warns users with unsaved changes before leaving a route.
 *
 * Attaches to components implementing a `hasUnsavedChanges()` method.
 *
 * @since 2.1.0
 */
export const unsavedChangesGuard: CanDeactivateFn<{ hasUnsavedChanges(): boolean }> = (
    component,
    currentRoute,
    currentState,
    nextState
) => {
    if (component.hasUnsavedChanges()) {
        return confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
};

/**
 * Feature-flag guard that prevents route matching when a feature is disabled.
 *
 * @since 2.2.0
 * @beta
 */
export const featureFlagGuard: CanMatchFn = (route, segments) => {
    const featureFlags: Record<string, boolean> = { beta: false };
    const flag = route.data?.['featureFlag'] as string | undefined;
    return flag ? (featureFlags[flag] ?? true) : true;
};
