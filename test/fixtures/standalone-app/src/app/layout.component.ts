import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Shell layout with header, sidebar, and content area.
 *
 * @since 1.0.0
 */
@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [RouterOutlet],
    template: `
        <header>Header</header>
        <main><router-outlet></router-outlet></main>
        <footer>Footer</footer>
    `,
})
export class LayoutComponent {}
