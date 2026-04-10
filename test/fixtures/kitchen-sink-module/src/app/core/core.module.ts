import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { TodoStore } from './services/todo.store';
import { ApiService } from './services/api.service';
import { NotificationService } from './services/notification.service';
import { CacheService } from './services/cache.service';

/**
 * Core module that provides singleton services.
 *
 * Should only be imported in the root `AppModule`.
 * Guards against re-import with an `@Optional()` + `@SkipSelf()` check.
 *
 * @example
 * ```typescript
 * @NgModule({ imports: [CoreModule] })
 * export class AppModule {}
 * ```
 */
@NgModule({
    imports: [CommonModule, HttpClientModule],
    providers: [TodoStore, ApiService, NotificationService, CacheService],
})
export class CoreModule {
    constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error('CoreModule is already loaded. Import it in AppModule only.');
        }
    }
}
