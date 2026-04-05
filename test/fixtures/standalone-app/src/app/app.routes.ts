import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
    },
];
