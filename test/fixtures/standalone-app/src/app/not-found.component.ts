import { Component } from '@angular/core';

/**
 * 404 page shown when no route matches.
 *
 * @since 1.0.0
 * @route **
 */
@Component({
    selector: 'app-not-found',
    standalone: true,
    template: `<h1>404</h1><p>Page not found.</p>`,
})
export class NotFoundComponent {}
