import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UnsavedChangesGuard } from './core/guards/unsaved-changes.guard';

/**
 * Application routes demonstrating guards, lazy loading, and nested routes.
 */
const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
    },
    {
        path: 'dashboard',
        loadChildren: () =>
            import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
        canActivate: [AuthGuard],
    },
    {
        path: 'users',
        loadChildren: () =>
            import('./features/users/users.module').then((m) => m.UsersModule),
        canActivate: [AuthGuard, RoleGuard],
    },
    {
        path: 'settings',
        loadChildren: () =>
            import('./features/settings/settings.module').then((m) => m.SettingsModule),
        canActivate: [AuthGuard],
        canDeactivate: [UnsavedChangesGuard],
    },
    {
        path: 'about',
        loadChildren: () =>
            import('./about/about.module').then((m) => m.AboutModule),
    },
    {
        path: '**',
        redirectTo: 'dashboard',
    },
];

/**
 * Routing module that configures all top-level routes.
 */
@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}
