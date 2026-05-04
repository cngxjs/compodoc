import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

/**
 * Interface that components must implement to use the unsaved changes guard.
 */
export interface HasUnsavedChanges {
    /** Whether the component has unsaved changes */
    hasUnsavedChanges(): boolean;
}

/**
 * Guard that prompts the user before navigating away from a dirty form.
 *
 * Components must implement the {@link HasUnsavedChanges} interface.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class EditComponent implements HasUnsavedChanges {
 *   hasUnsavedChanges() { return this.form.dirty; }
 * }
 * ```
 *
 * @since 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard implements CanDeactivate<HasUnsavedChanges> {
    /**
     * Check whether navigation should be allowed.
     *
     * @param component - The component being deactivated
     * @returns True if safe to leave, or an observable that resolves to boolean
     */
    canDeactivate(
        component: HasUnsavedChanges
    ): Observable<boolean> | Promise<boolean> | boolean {
        if (component.hasUnsavedChanges()) {
            return confirm('You have unsaved changes. Leave this page?');
        }
        return true;
    }
}
