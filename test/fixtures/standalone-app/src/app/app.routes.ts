import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

/**
 * Application routes configuration.
 * @since 1.0.0
 */
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
    },
    {
        path: 'users',
        loadComponent: () =>
            import('./components/user-list.component').then(m => m.UserListComponent),
        canActivate: [authGuard],
        children: [
            {
                path: ':id',
                loadComponent: () =>
                    import('./components/user-card.component').then(m => m.UserCardComponent),
            },
        ],
    },
    {
        path: 'settings',
        loadComponent: () =>
            import('./components/settings.component').then(m => m.SettingsComponent),
    },
];
