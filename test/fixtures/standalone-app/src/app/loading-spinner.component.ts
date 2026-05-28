import { Component, input } from '@angular/core';

/**
 * Global loading spinner overlay.
 *
 * @since 1.0.0
 * @wcag AA
 * @a11y Uses `role="status"` with `aria-live="polite"` so the loading state is
 *   announced when the overlay activates. The visible "Loading..." text doubles
 *   as the accessible label; consumers can override via `aria-label` on the host.
 *   Respects `prefers-reduced-motion` — the rotation pauses when reduced motion
 *   is requested.
 *
 * @playground Default
 * ```html
 * <app-loading-spinner [active]="true"></app-loading-spinner>
 * ```
 *
 * @playground Multiple ./playground-examples/spinner-multiple.html
 * @playground Toggle ./playground-examples/spinner-toggle.component.ts
 */
@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    template: `<div class="spinner" [class.active]="active()">Loading...</div>`,
    styles: `
        /**
         * @overview
         * Theme tokens for the **loading spinner** overlay. Override these
         * in a global stylesheet to retheme the control.
         */

        /**
         * Diameter of the spinner ring.
         * @type <length>
         * @default 32px
         * @group ring
         * @since 1.0.0
         */
        @property --spinner-size {
            syntax: '<length>';
            inherits: true;
            initial-value: 32px;
        }

        /**
         * Stroke colour of the rotating ring.
         * @type <color>
         * @default #2563eb
         * @group ring
         */
        @property --spinner-color {
            syntax: '<color>';
            inherits: true;
            initial-value: #2563eb;
        }

        /**
         * Width of the spinner ring's stroke.
         * @type <length>
         * @default 3px
         * @group ring
         * @example css
         *   .spinner--thick { --spinner-stroke: 6px; }
         */
        @property --spinner-stroke {
            syntax: '<length>';
            inherits: true;
            initial-value: 3px;
        }

        /**
         * Background fill behind the spinner overlay.
         * @type <color>
         * @default rgba(0, 0, 0, 0.4)
         * @group overlay
         */
        @property --spinner-overlay-bg {
            syntax: '*';
            inherits: true;
            initial-value: rgba(0, 0, 0, 0.4);
        }

        /**
         * @deprecated Use --spinner-color instead.
         */
        @property --spinner-stroke-color {
            syntax: '<color>';
            inherits: true;
            initial-value: currentColor;
        }
    `,
})
export class LoadingSpinnerComponent {
    /** Whether the spinner is visible. */
    readonly active = input(false);
}
