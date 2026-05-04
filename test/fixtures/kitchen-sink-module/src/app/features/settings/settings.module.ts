import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SettingsComponent } from './settings.component';

const routes: Routes = [
    { path: '', component: SettingsComponent },
];

/**
 * Settings feature module.
 *
 * @category Features
 */
@NgModule({
    declarations: [SettingsComponent],
    imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SettingsModule {}
