import { InjectionToken, NgModule } from '@angular/core';
import { getDefaultApiRoot } from './utils';

export const API_ROOT = new InjectionToken<string>('my-lib::API_ROOT', {
    providedIn: 'root',
    factory: () => '/api',
});

@NgModule({
    providers: [
        { provide: API_ROOT, useValue: getDefaultApiRoot() }
    ]
})
export class CoreModule {
}