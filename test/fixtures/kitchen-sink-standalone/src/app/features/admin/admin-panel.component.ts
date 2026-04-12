import {
    Component,
    ChangeDetectionStrategy,
    ViewEncapsulation,
    inject,
    signal,
    InjectionToken,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
    trigger,
    state,
    style,
    transition,
    animate,
} from "@angular/animations";

import { HasUnsavedChanges } from "../../core/guards/unsaved-changes.guard";
import { SignalCardComponent } from "../../shared/components/signal-card.component";
import { DataTableComponent } from "../../shared/components/data-table.component";
import { HighlightDirective } from "../../shared/directives/highlight.directive";
import { TooltipDirective } from "../../shared/directives/tooltip.directive";
import { TimeAgoPipe } from "../../shared/pipes/time-ago.pipe";
import { TruncatePipe } from "../../shared/pipes/truncate.pipe";
import { ThemeService } from "../../core/services/theme.service";
import { ApiService } from "../../core/services/api.service";
import { TodoStore } from "../../core/services/todo.store";
import {
    FEATURE_FLAGS,
    API_BASE_URL,
    APP_VERSION,
} from "../../core/tokens/api.tokens";
import { STORAGE_KEY } from "../../core/tokens/storage.tokens";
import { MAX_RETRIES } from "../../core/tokens/retry.tokens";

/**
 * Factory for a feature-flag map tailored to the admin experience.
 * Reads the base flags and enriches them with admin-only toggles.
 */
export function adminFeatureFlagsFactory(baseFlags: Record<string, boolean>) {
    return {
        ...baseFlags,
        adminDashboard: true,
        experimentalBulkEdit: true,
    };
}

/**
 * Local injection token for an admin audit channel name.
 * Used by the component's own providers below.
 */
export const ADMIN_AUDIT_CHANNEL = new InjectionToken<string>(
    "ADMIN_AUDIT_CHANNEL",
    {
        providedIn: "root",
        factory: () => "admin-audit-default",
    },
);

/**
 * Extracted host-directive configuration. Demonstrates the case where the
 * object literal lives in a separate const and is referenced by identifier
 * in the `hostDirectives` array.
 */
export const TOOLTIP_HOST_DIRECTIVE = {
    directive: TooltipDirective,
    inputs: ["appTooltip: tooltip", "position"],
};

/**
 * Admin panel with settings management.
 *
 * Fully maxed-out component showing every metadata field compodocx can
 * extract: imports of every artefact kind (module, component, directive,
 * pipe, class helper), providers using every useClass / useValue /
 * useFactory / useExisting pattern (plus an InjectionToken), plus
 * viewProviders, animations, encapsulation, change detection, host
 * bindings/listeners and host directives.
 *
 * Implements {@link HasUnsavedChanges} for the route guard.
 * @example
 * ```typescript
// Bind button state to an alert
<cngx-action-button #btn="cngxActionButton" [action]="save">
  Save
</cngx-action-button>
<cngx-alert [state]="btn.state" title="Save Status" />
```
 *
 * @category Features
 * @route /admin
 * @since 2.0.0
 * @storybook https://storybook.example.com/?path=/story/features-admin-panel--default
 * @figma https://www.figma.com/file/abc123/Admin-Panel?node-id=7:42
 * @stackblitz https://stackblitz.com/edit/angular-admin-panel-demo
 * @github https://github.com/cngxjs/compodocx/blob/develop/test/fixtures/kitchen-sink-standalone/src/app/features/admin/admin-panel.component.ts
 * @docs https://cngx.dev/features/admin-panel
 */
@Component({
    selector: "app-admin-panel",
    standalone: true,
    imports: [
        // module
        CommonModule,
        // components
        SignalCardComponent,
        DataTableComponent,
        // directives
        HighlightDirective,
        TooltipDirective,
        // pipes
        TimeAgoPipe,
        TruncatePipe,
    ],
    providers: [
        // bare class shorthand — uses useClass internally
        ApiService,
        // explicit useClass
        { provide: ThemeService, useClass: ThemeService },
        // useValue for primitives
        { provide: APP_VERSION, useValue: "2.0.0-admin" },
        // useValue for objects
        { provide: STORAGE_KEY, useValue: "admin-panel-store" },
        // useFactory with deps
        {
            provide: FEATURE_FLAGS,
            useFactory: adminFeatureFlagsFactory,
            deps: [API_BASE_URL],
        },
        // useExisting aliasing
        { provide: "AuditToken", useExisting: ADMIN_AUDIT_CHANNEL },
        // multi provider
        { provide: MAX_RETRIES, useValue: 5, multi: true },
        // local token defined above
        ADMIN_AUDIT_CHANNEL,
    ],
    viewProviders: [
        // Scoped to the component view — a separate TodoStore instance
        // only the template can see.
        { provide: TodoStore, useClass: TodoStore },
    ],
    exportAs: "appAdminPanel",
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.ShadowDom,
    preserveWhitespaces: false,
    interpolation: ["{{", "}}"],
    host: {
        class: "app-admin-panel",
        role: "region",
        "[attr.aria-label]": '"Admin settings"',
        "[class.is-dirty]": "dirty()",
        "(document:keydown.escape)": "onEscape($event)",
    },
    hostDirectives: [
        {
            directive: HighlightDirective,
            inputs: ["color", "hoverColor", "enabled"],
            outputs: [],
        },
        // Bare directive class
        TooltipDirective,
        // Reference to an extracted const (see TOOLTIP_HOST_DIRECTIVE above)
        TOOLTIP_HOST_DIRECTIVE,
    ],
    animations: [
        trigger("settingsToggle", [
            state("collapsed", style({ height: "0px", opacity: 0 })),
            state("expanded", style({ height: "*", opacity: 1 })),
            transition("collapsed <=> expanded", [
                animate("200ms ease-in-out"),
            ]),
        ]),
    ],
    template: `
        <h1>Admin Panel</h1>
        <app-signal-card
            [title]="'Settings'"
            [(expanded)]="settingsExpanded"
            [selectedIndex]="selectedIdx"
        >
            <div appHighlight [color]="'#f0f0f0'" [hoverColor]="'#e0e0ff'">
                <button appTooltip="Save current settings">Save</button>
            </div>
        </app-signal-card>
    `,
    styles: [
        `
            :host {
                display: block;
                padding: 1rem;
            }
            :host(.is-dirty) h1::after {
                content: " *";
                color: crimson;
            }
        `,
    ],
})
export class AdminPanelComponent implements HasUnsavedChanges {
    private readonly theme = inject(ThemeService);
    private readonly api = inject(ApiService);
    private readonly todos = inject(TodoStore);

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

    /**
     * Escape key closes the settings panel.
     */
    onEscape(event: KeyboardEvent): void {
        event.preventDefault();
        this.settingsExpanded.set(false);
    }
}
