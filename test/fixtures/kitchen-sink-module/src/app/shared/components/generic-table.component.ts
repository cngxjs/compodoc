import {
    Component,
    ContentChild,
    ContentChildren,
    Input,
    Output,
    EventEmitter,
    TemplateRef,
    QueryList,
    OnChanges,
    SimpleChanges,
} from '@angular/core';

/**
 * Column definition for the generic table.
 */
export interface ColumnDef<T = unknown> {
    /** Unique column key */
    key: string;
    /** Display header text */
    header: string;
    /** Optional value accessor function */
    accessor?: (row: T) => unknown;
    /** Whether the column is sortable */
    sortable?: boolean;
    /** Column width (CSS value) */
    width?: string;
}

/**
 * A generic, reusable table component with sorting and custom templates.
 *
 * Uses generics to provide type-safe column definitions and row data.
 *
 * @example
 * ```html
 * <app-generic-table
 *   [columns]="columns"
 *   [data]="users"
 *   [striped]="true"
 *   (rowClicked)="onRowClick($event)">
 * </app-generic-table>
 * ```
 *
 * @since 1.2.0
 */
@Component({
    selector: 'app-generic-table',
    template: `
        <table>
            <thead>
                <tr>
                    <th *ngFor="let col of columns" (click)="onSort(col)">
                        {{ col.header }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr *ngFor="let row of data; trackBy: trackByIndex" (click)="rowClicked.emit(row)">
                    <td *ngFor="let col of columns">
                        {{ getCellValue(row, col) }}
                    </td>
                </tr>
            </tbody>
        </table>
    `,
})
export class GenericTableComponent<T = unknown> implements OnChanges {
    /**
     * Column definitions.
     */
    @Input() columns: ColumnDef<T>[] = [];

    /**
     * Row data to display.
     */
    @Input() data: T[] = [];

    /**
     * Whether to apply striped row styling.
     */
    @Input() striped: boolean = false;

    /**
     * Whether to show a loading skeleton.
     */
    @Input() loading: boolean = false;

    /**
     * Custom header template.
     */
    @ContentChild('headerTemplate') headerTemplate?: TemplateRef<unknown>;

    /**
     * Custom cell templates.
     */
    @ContentChildren('cellTemplate') cellTemplates!: QueryList<TemplateRef<unknown>>;

    /**
     * Emitted when a row is clicked.
     */
    @Output() rowClicked = new EventEmitter<T>();

    /**
     * Emitted when a column header is clicked for sorting.
     */
    @Output() sortChanged = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();

    /** @internal */
    private sortDirection: 'asc' | 'desc' = 'asc';

    /** @ignore */
    ngOnChanges(changes: SimpleChanges): void {
        // could re-sort on data change
    }

    /**
     * Get the display value for a cell.
     *
     * @param row - The row data
     * @param col - The column definition
     * @returns The cell display value
     */
    getCellValue(row: T, col: ColumnDef<T>): unknown {
        if (col.accessor) return col.accessor(row);
        return (row as Record<string, unknown>)[col.key];
    }

    /**
     * Track function for ngFor.
     */
    trackByIndex(index: number): number {
        return index;
    }

    /**
     * Handle column sort clicks.
     * @internal
     */
    private onSort(col: ColumnDef<T>): void {
        if (!col.sortable) return;
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        this.sortChanged.emit({ key: col.key, direction: this.sortDirection });
    }
}
