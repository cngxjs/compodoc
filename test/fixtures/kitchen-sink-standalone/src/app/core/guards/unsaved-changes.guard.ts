import { CanDeactivateFn } from '@angular/router';

/**
 * Component interface for unsaved changes detection.
 */
export interface HasUnsavedChanges {
    hasUnsavedChanges(): boolean;
}

/**
 * Functional guard that prompts before leaving a dirty component.
 *
 * The component must implement {@link HasUnsavedChanges}.
 *
 * @since 2.0.0
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
    if (component.hasUnsavedChanges()) {
        return confirm('You have unsaved changes. Leave this page?');
    }
    return true;
};
