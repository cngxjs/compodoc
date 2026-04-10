import {
    Component,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild,
    ViewChildren,
    ContentChild,
    ContentChildren,
    ElementRef,
    QueryList,
    TemplateRef,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { TodoStore } from './core/services/todo.store';
import { Todo } from './core/models/todo.model';

/**
 * Root application component.
 *
 * Demonstrates lifecycle hooks, host bindings, host listeners,
 * view/content queries, and various property types.
 *
 * @example
 * ```html
 * <app-root [title]="'Kitchen Sink'" (closed)="onClose()"></app-root>
 * ```
 *
 * @deprecated Use `StandaloneAppComponent` instead for new projects.
 *
 * @since 0.1.0
 * @beta
 */
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnChanges, OnDestroy {
    /**
     * The main title displayed in the header.
     *
     * @example
     * ```html
     * <app-root title="My App"></app-root>
     * ```
     */
    @Input() title: string = 'kitchen-sink';

    /**
     * Whether the sidebar is collapsed.
     */
    @Input() sidebarCollapsed: boolean = false;

    /**
     * CSS class applied to the host element.
     */
    @HostBinding('class.app-root') isRoot = true;

    /**
     * Controls the aria-label of the host element.
     */
    @HostBinding('attr.aria-label') ariaLabel = 'Application root';

    /**
     * The first child template reference.
     */
    @ViewChild('mainContent') mainContent!: ElementRef;

    /**
     * All panel elements in the view.
     */
    @ViewChildren('panel') panels!: QueryList<ElementRef>;

    /**
     * Projected header content.
     */
    @ContentChild('headerSlot') headerSlot!: TemplateRef<unknown>;

    /**
     * All projected footer items.
     */
    @ContentChildren('footerItem') footerItems!: QueryList<TemplateRef<unknown>>;

    /**
     * Internal destroy subject for subscriptions.
     * @internal
     */
    private destroy$ = new Subject<void>();

    /**
     * Whether the app is currently loading data.
     */
    protected isLoading = false;

    /**
     * Track the last window resize dimensions.
     * @internal
     */
    private lastResize: { width: number; height: number } | null = null;

    constructor(private todoStore: TodoStore) {}

    /**
     * Handle window resize events.
     */
    @HostListener('window:resize', ['$event'])
    onResize(event: Event): void {
        const w = event.target as Window;
        this.lastResize = { width: w.innerWidth, height: w.innerHeight };
    }

    /**
     * Handle document keydown for keyboard shortcuts.
     */
    @HostListener('document:keydown', ['$event'])
    onKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            this.sidebarCollapsed = true;
        }
    }

    /** @ignore */
    ngOnInit(): void {
        this.isLoading = true;
    }

    /** @ignore */
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['title']) {
            this.ariaLabel = `Application: ${this.title}`;
        }
    }

    /** @ignore */
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Retrieve all todos as an observable stream.
     *
     * @returns An observable of the todo list.
     *
     * @example
     * ```typescript
     * this.getTodos().subscribe(todos => console.log(todos));
     * ```
     */
    getTodos(): Observable<Todo[]> {
        return new Observable((subscriber) => {
            subscriber.next(this.todoStore.getAll());
            subscriber.complete();
        });
    }

    /**
     * A generic property accessor for deep objects.
     *
     * @param obj - The source object
     * @param key - The property key to retrieve
     * @returns The property value
     */
    getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
        return obj[key];
    }

    /**
     * Toggle sidebar visibility.
     */
    toggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }
}
