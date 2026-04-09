import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CacheService } from '../../core/services/cache.service';

/**
 * A local cache configuration for this component only.
 */
class LocalCacheService extends CacheService {
    override get<T>(key: string): T | undefined {
        return super.get<T>(`local-${key}`);
    }
}

/**
 * Component demonstrating `viewProviders`.
 *
 * Provides a `LocalCacheService` scoped to the component's view,
 * which is not available to projected content.
 *
 * @example
 * ```html
 * <app-view-providers-demo>
 *   <child-component></child-component> <!-- does NOT see LocalCacheService -->
 * </app-view-providers-demo>
 * ```
 *
 * @since 1.3.0
 */
@Component({
    selector: 'app-view-providers-demo',
    template: `<div><ng-content></ng-content></div>`,
    viewProviders: [{ provide: CacheService, useClass: LocalCacheService }],
    encapsulation: ViewEncapsulation.ShadowDom,
})
export class ViewProvidersDemoComponent {
    /**
     * Component title.
     */
    @Input() title: string = '';
}
