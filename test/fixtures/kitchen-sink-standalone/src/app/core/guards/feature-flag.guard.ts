import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { FEATURE_FLAGS } from '../tokens/api.tokens';

/**
 * Functional guard that gates routes behind feature flags.
 *
 * Reads the `featureFlag` key from `route.data` and checks it against
 * the FEATURE_FLAGS token.
 *
 * @example
 * ```typescript
 * {
 *   path: 'experimental',
 *   canActivate: [featureFlagGuard],
 *   data: { featureFlag: 'experimentalDashboard' },
 *   component: ExperimentalComponent,
 * }
 * ```
 *
 * @since 2.0.0
 * @beta
 */
export const featureFlagGuard: CanActivateFn = (route) => {
    const router = inject(Router);
    const flags = inject(FEATURE_FLAGS);
    const flagName: string = route.data['featureFlag'] ?? '';

    if (flagName && flags[flagName]) {
        return true;
    }

    return router.createUrlTree(['/']);
};

/**
 * CanMatch variant that prevents route matching when a feature flag is off.
 *
 * @since 2.0.0
 * @beta
 */
export const featureFlagMatcher: CanMatchFn = (route) => {
    const flags = inject(FEATURE_FLAGS);
    const flagName: string = (route.data as Record<string, unknown>)?.['featureFlag'] as string ?? '';
    return !!flagName && !!flags[flagName];
};
