import { Component } from '@angular/core';
import { UserListComponent } from './components/user-list.component';
import { GreetingPipe } from './components/greeting.pipe';

/**
 * Root application component -- fully standalone, no NgModule.
 *
 * @since 1.0.0
 * @route /
 * @storybook https://storybook.example.com/?path=/story/app
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [UserListComponent, GreetingPipe],
    template: `
        <h1>{{ 'World' | greeting }}</h1>
        <app-user-list></app-user-list>
    `,
})
export class AppComponent {
    /** Application title. */
    title = 'standalone-app';
}
