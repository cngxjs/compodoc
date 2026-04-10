import { Component } from '@angular/core';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';

/**
 * Settings page with form state tracking.
 *
 * @category Features
 * @route /settings
 */
@Component({
    selector: 'app-settings',
    template: `
        <h1>Settings</h1>
        <form>
            <label>Theme: <select [(ngModel)]="theme"><option>light</option><option>dark</option></select></label>
        </form>
    `,
})
export class SettingsComponent implements HasUnsavedChanges {
    /**
     * Current theme selection.
     */
    theme: string = 'light';

    /**
     * Whether the form is dirty.
     */
    private dirty = false;

    /**
     * Guard interface method.
     */
    hasUnsavedChanges(): boolean {
        return this.dirty;
    }
}
