import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { UserListComponent } from './user-list.component';
import { UserDetailComponent } from './user-detail.component';
import { UserService } from './user.service';

const routes: Routes = [
    { path: '', component: UserListComponent },
    { path: ':id', component: UserDetailComponent },
];

/**
 * Feature module for user management.
 *
 * @category Features
 */
@NgModule({
    declarations: [UserListComponent, UserDetailComponent],
    imports: [SharedModule, RouterModule.forChild(routes)],
    providers: [UserService],
})
export class UsersModule {}
