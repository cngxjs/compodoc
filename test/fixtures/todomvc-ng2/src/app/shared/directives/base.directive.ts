import { Directive, EventEmitter, Input, Output } from '@angular/core';

/**
 * @beta
 * @since 2.0.0
 * @breaking 3.0
 */
@Directive()
export abstract class BaseDirective {
    @Input() testPropertyInBase = false;
    @Output() testEventInBase = new EventEmitter<void>();
}
