import {
    APP_INITIALIZER,
    CUSTOM_ELEMENTS_SCHEMA,
    InjectionToken,
    ModuleWithProviders,
    NgModule,
    NO_ERRORS_SCHEMA,
    Optional,
    SkipSelf,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ApiService } from '../core/services/api.service';
import { CacheService } from '../core/services/cache.service';
import { NotificationService } from '../core/services/notification.service';
import { TodoStore } from '../core/services/todo.store';
import { DashboardComponent } from '../features/dashboard/dashboard.component';
import { StatsCardComponent } from '../features/dashboard/stats-card.component';
import { SettingsComponent } from '../features/settings/settings.component';
import { UserDetailComponent } from '../features/users/user-detail.component';
import { UserListComponent } from '../features/users/user-list.component';
import { UserService } from '../features/users/user.service';
import { AutofocusDirective } from '../shared/directives/autofocus.directive';
import { DebounceClickDirective } from '../shared/directives/debounce-click.directive';
import { HighlightDirective } from '../shared/directives/highlight.directive';
import { TooltipDirective } from '../shared/directives/tooltip.directive';
import { FileSizePipe } from '../shared/pipes/file-size.pipe';
import { FirstUpperPipe } from '../shared/pipes/first-upper.pipe';
import { SafeHtmlPipe } from '../shared/pipes/safe-html.pipe';
import { TimeAgoPipe } from '../shared/pipes/time-ago.pipe';
import { TruncatePipe } from '../shared/pipes/truncate.pipe';

/**
 * Configuration accepted by {@link ShowcaseModule.forRoot}. Only the
 * `apiUrl` is required — everything else defaults to sensible values
 * tuned for local development.
 */
export interface ShowcaseConfig {
    /** Base URL for the backend, without trailing slash. */
    apiUrl: string;
    /** When true, ships usage events to the telemetry endpoint. */
    enableTelemetry?: boolean;
    /** Number of retries on transient HTTP failures. Defaults to 2. */
    retryCount?: number;
}

/**
 * Injection token for the application-wide {@link ShowcaseConfig}.
 * Provided at the root by {@link ShowcaseModule.forRoot}.
 */
export const SHOWCASE_CONFIG = new InjectionToken<ShowcaseConfig>('SHOWCASE_CONFIG');

/**
 * Showcase module — intentionally exercises every NgModule metadata field
 * supported by compodocx so the module detail page renders a worked
 * example of declarations, providers, imports, exports, bootstrap,
 * entryComponents, schemas, static factory methods, and a constructor.
 *
 * Used as the styling baseline for `src/templates/pages/ModulePage.tsx` —
 * if a field renders anywhere on the module page, a non-empty example
 * lives here.
 *
 * The providers array is deliberately heterogeneous:
 *
 * - bare class shorthand (`TodoStore`)
 * - `useClass` object form
 * - `useValue` with a primitive
 * - `useFactory` with `deps`
 * - `multi: true` registered against `HTTP_INTERCEPTORS`
 * - `APP_INITIALIZER` factory
 *
 * @example
 * ```typescript
 * @NgModule({
 *   imports: [
 *     ShowcaseModule.forRoot({
 *       apiUrl: 'https://api.example.com',
 *       enableTelemetry: true,
 *       retryCount: 3,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @deprecated Slated for removal in v3.0. Migrate to the standalone
 * component equivalents under `src/app/standalone`.
 * @since 1.4.0
 * @see https://angular.dev/api/core/NgModule
 */
@NgModule({
    declarations: [
        DashboardComponent,
        StatsCardComponent,
        UserListComponent,
        UserDetailComponent,
        SettingsComponent,
        HighlightDirective,
        TooltipDirective,
        DebounceClickDirective,
        AutofocusDirective,
        TimeAgoPipe,
        TruncatePipe,
        FileSizePipe,
        FirstUpperPipe,
        SafeHtmlPipe,
    ],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
    providers: [
        TodoStore,
        NotificationService,
        UserService,
        { provide: ApiService, useClass: ApiService },
        { provide: 'CACHE_TTL', useValue: 30_000 },
        {
            provide: CacheService,
            useFactory: () => new CacheService(),
            deps: [],
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: ApiService,
            multi: true,
        },
        {
            provide: APP_INITIALIZER,
            useFactory: (api: ApiService) => () => api.isFeatureEnabled('boot'),
            deps: [ApiService],
            multi: true,
        },
    ],
    exports: [
        DashboardComponent,
        UserListComponent,
        HighlightDirective,
        TooltipDirective,
        TimeAgoPipe,
        TruncatePipe,
        CommonModule,
        FormsModule,
    ],
    bootstrap: [DashboardComponent],
    entryComponents: [StatsCardComponent, UserDetailComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class ShowcaseModule {
    /**
     * Singleton guard — throws when the module is imported twice.
     * The `@Optional()` + `@SkipSelf()` pair looks up the parent injector
     * and fails fast if the module is already present, matching the
     * pattern documented at angular.dev/guide/ngmodules/singleton-services.
     *
     * @param parentModule resolved from the parent injector when present
     */
    constructor(@Optional() @SkipSelf() parentModule: ShowcaseModule) {
        if (parentModule) {
            throw new Error(
                'ShowcaseModule is already loaded. Import it in AppModule only.'
            );
        }
    }

    /**
     * Register the showcase module at the application root. Supplies the
     * {@link SHOWCASE_CONFIG} provider so feature modules resolved later
     * via `forChild()` can inject it.
     *
     * @param config the application-wide configuration
     * @returns a `ModuleWithProviders` object suitable for the root import
     *
     * @example
     * ```typescript
     * ShowcaseModule.forRoot({
     *     apiUrl: 'https://api.example.com',
     *     enableTelemetry: true,
     * })
     * ```
     */
    static forRoot(config: ShowcaseConfig): ModuleWithProviders<ShowcaseModule> {
        return {
            ngModule: ShowcaseModule,
            providers: [{ provide: SHOWCASE_CONFIG, useValue: config }],
        };
    }

    /**
     * Register the showcase module in a lazy-loaded feature module. Does
     * NOT re-register the config provider — it is expected to be resolved
     * from the root injector.
     *
     * @returns a `ModuleWithProviders` object suitable for feature imports
     */
    static forChild(): ModuleWithProviders<ShowcaseModule> {
        return {
            ngModule: ShowcaseModule,
            providers: [],
        };
    }

    /**
     * Marks a running {@link SHOWCASE_CONFIG} as stale without requiring a
     * full module reload. Downstream services observe the token and
     * refresh lazily on next access.
     *
     * @param reason short human-readable diagnostic for the log stream
     */
    invalidateConfig(reason: string): void {
        console.warn(`[ShowcaseModule] config invalidated: ${reason}`);
    }
}
