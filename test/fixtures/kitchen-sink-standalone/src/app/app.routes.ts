import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { featureFlagGuard } from './core/guards/feature-flag.guard';

/**
 * Application routes with lazy-loading, guards, and resolvers.
 *
 * @since 2.0.0
 */
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [authGuard],
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./features/users/user-list.component').then((m) => m.UserListComponent),
        canActivate: [authGuard, roleGuard],
        children: [
            {
                path: ':id',
                loadComponent: () =>
                    import('./features/users/user-detail.component').then(
                        (m) => m.UserDetailComponent
                    ),
            },
        ],
    },
    {
        path: 'admin',
        loadComponent: () =>
            import('./features/admin/admin-panel.component').then((m) => m.AdminPanelComponent),
        canActivate: [authGuard, roleGuard],
        canDeactivate: [unsavedChangesGuard],
    },
    {
        path: 'experimental',
        loadComponent: () =>
            import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [featureFlagGuard],
    },
    {
        path: '**',
        redirectTo: 'dashboard',
    },
];
