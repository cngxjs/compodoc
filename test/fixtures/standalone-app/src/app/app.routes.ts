import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard, unsavedChangesGuard, featureFlagGuard } from './core/guards/role.guard';

/**
 * Application routes configuration.
 * @since 1.0.0
 */
export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./users/components/user-list.component').then(m => m.UserListComponent),
        canActivate: [authGuard],
        children: [
            {
                path: ':id',
                loadComponent: () =>
                    import('./users/components/user-detail.component').then(m => m.UserDetailComponent),
            },
        ],
    },
    {
        path: 'settings',
        loadComponent: () =>
            import('./settings/settings.component').then(m => m.SettingsComponent),
        canDeactivate: [unsavedChangesGuard],
    },
    {
        path: 'admin',
        loadComponent: () =>
            import('./features/admin/admin-panel.component').then(m => m.AdminPanelComponent),
        canActivate: [adminGuard, roleGuard('admin', 'superadmin')],
        canMatch: [featureFlagGuard],
        data: { featureFlag: 'beta' },
    },
];
