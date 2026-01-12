import { InjectionToken, NgModule } from '@angular/core';
import { getDefaultApiRoot } from './utils';

export interface DataConfig {
    apiRoot: string;
}

export const DATA_CONFIG = new InjectionToken<DataConfig>('DataConfig');

@NgModule({
    providers: [
        { provide: DATA_CONFIG, useValue: { apiRoot: getDefaultApiRoot() } }
    ]
})
export class DataModule {
}