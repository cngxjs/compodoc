import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasUnsavedChanges } from '../../core/guards/unsaved-changes.guard';
import { SignalCardComponent } from '../../shared/components/signal-card.component';
import { HighlightDirective } from '../../shared/directives/highlight.directive';
import { TooltipDirective } from '../../shared/directives/tooltip.directive';

/**
 * Admin panel with settings management.
 *
 * Implements {@link HasUnsavedChanges} for the route guard.
 *
 * @category Features
 * @route /admin
 * @since 2.0.0
 */
@Component({
    selector: 'app-admin-panel',
    standalone: true,
    imports: [CommonModule, SignalCardComponent, HighlightDirective, TooltipDirective],
    template: `
        <h1>Admin Panel</h1>
        <app-signal-card
            [title]="'Settings'"
            [(expanded)]="settingsExpanded"
            [selectedIndex]="selectedIdx">
            <div appHighlight [color]="'#f0f0f0'" [hoverColor]="'#e0e0ff'">
                <button appTooltip="Save current settings">Save</button>
            </div>
        </app-signal-card>
    `,
})
export class AdminPanelComponent implements HasUnsavedChanges {
    /**
     * Settings card expanded state.
     */
    readonly settingsExpanded = signal(true);

    /**
     * Selected setting index.
     */
    readonly selectedIdx = signal(0);

    /**
     * Whether settings have been modified.
     */
    readonly dirty = signal(false);

    /**
     * Check for unsaved changes.
     */
    hasUnsavedChanges(): boolean {
        return this.dirty();
    }
}
