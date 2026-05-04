import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DashboardComponent } from './dashboard.component';
import { StatsCardComponent } from './stats-card.component';

const routes: Routes = [
    { path: '', component: DashboardComponent },
];

/**
 * Feature module for the dashboard view.
 *
 * @category Features
 */
@NgModule({
    declarations: [DashboardComponent, StatsCardComponent],
    imports: [SharedModule, RouterModule.forChild(routes)],
})
export class DashboardModule {}
