import { Component, input } from '@angular/core';

/**
 * Breadcrumb navigation bar.
 *
 * @since 1.1.0
 * @category Navigation
 */
@Component({
    selector: 'app-breadcrumb',
    standalone: true,
    template: `<nav aria-label="breadcrumb"><ol></ol></nav>`,
})
export class BreadcrumbComponent {
    readonly items = input<string[]>([]);
}
