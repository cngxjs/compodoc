import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { UsersModule } from './features/users/users.module';
import { AboutModule } from './about/about.module';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { CacheInterceptor } from './core/interceptors/cache.interceptor';

/**
 * Root application module for the kitchen-sink demo.
 *
 * Bootstraps the entire app, wires up HTTP interceptors,
 * and imports all feature modules.
 *
 * @example
 * ```typescript
 * platformBrowserDynamic().bootstrapModule(AppModule);
 * ```
 *
 * @since 1.0.0
 */
@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AppRoutingModule,
        CoreModule,
        SharedModule,
        DashboardModule,
        UsersModule,
        AboutModule,
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {
    /**
     * Configure the AppModule with optional providers.
     *
     * @example
     * ```typescript
     * AppModule.forRoot({ apiUrl: '/api' });
     * ```
     */
    static forRoot(config?: { apiUrl?: string }) {
        return {
            ngModule: AppModule,
            providers: [],
        };
    }
}
