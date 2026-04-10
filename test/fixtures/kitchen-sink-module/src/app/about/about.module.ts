import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AboutComponent } from './about.component';

const routes: Routes = [
    { path: '', component: AboutComponent },
];

/**
 * Module for the about page.
 *
 * @category About
 */
@NgModule({
    declarations: [AboutComponent],
    imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AboutModule {}
