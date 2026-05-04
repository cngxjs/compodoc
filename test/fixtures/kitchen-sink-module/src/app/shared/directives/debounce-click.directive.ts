import { Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * Directive that debounces click events to prevent rapid-fire submissions.
 *
 * @example
 * ```html
 * <button appDebounceClick [debounceTime]="500" (debounceClick)="save()">Save</button>
 * ```
 *
 * @since 1.1.0
 */
@Directive({
    selector: '[appDebounceClick]',
})
export class DebounceClickDirective implements OnInit, OnDestroy {
    /**
     * Debounce time in milliseconds.
     */
    @Input() debounceTime: number = 300;

    /**
     * Emitted after the debounce period, with the original mouse event.
     */
    @Output() debounceClick = new EventEmitter<MouseEvent>();

    private clicks$ = new Subject<MouseEvent>();
    private subscription!: Subscription;

    /** @ignore */
    ngOnInit(): void {
        this.subscription = this.clicks$
            .pipe(debounceTime(this.debounceTime))
            .subscribe((e) => this.debounceClick.emit(e));
    }

    /** @ignore */
    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    /**
     * Capture click events.
     */
    @HostListener('click', ['$event'])
    onClick(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.clicks$.next(event);
    }
}
