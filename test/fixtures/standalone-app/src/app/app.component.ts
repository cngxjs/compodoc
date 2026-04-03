import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
    imports: [RouterOutlet, GreetingPipe],
    template: `
        <h1>{{ 'World' | greeting }}</h1>
        <router-outlet></router-outlet>
    `,
})
export class AppComponent {
    /** Application title. */
    title = 'standalone-app';
}
