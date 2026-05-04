import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TodoListComponent } from './components/todo-list.component';
import { TodoItemComponent } from './components/todo-item.component';
import { GenericTableComponent } from './components/generic-table.component';
import { BaseCardComponent } from './components/base-card.component';
import { DetailCardComponent } from './components/detail-card.component';
import { InheritedCardComponent } from './components/inherited-card.component';
import { HostDirDemoComponent } from './components/host-dir-demo.component';
import { ViewProvidersDemoComponent } from './components/view-providers-demo.component';

import { HighlightDirective } from './directives/highlight.directive';
import { TooltipDirective } from './directives/tooltip.directive';
import { AutofocusDirective } from './directives/autofocus.directive';
import { DebounceClickDirective } from './directives/debounce-click.directive';

import { FirstUpperPipe } from './pipes/first-upper.pipe';
import { TruncatePipe } from './pipes/truncate.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { FileSizePipe } from './pipes/file-size.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

/**
 * Shared module containing reusable components, directives, and pipes.
 *
 * Import this module in any feature module that needs these shared artifacts.
 *
 * @example
 * ```typescript
 * @NgModule({ imports: [SharedModule] })
 * export class FeatureModule {}
 * ```
 */
@NgModule({
    declarations: [
        TodoListComponent,
        TodoItemComponent,
        GenericTableComponent,
        BaseCardComponent,
        DetailCardComponent,
        InheritedCardComponent,
        HostDirDemoComponent,
        ViewProvidersDemoComponent,
        HighlightDirective,
        TooltipDirective,
        AutofocusDirective,
        DebounceClickDirective,
        FirstUpperPipe,
        TruncatePipe,
        TimeAgoPipe,
        FileSizePipe,
        SafeHtmlPipe,
    ],
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TodoListComponent,
        TodoItemComponent,
        GenericTableComponent,
        BaseCardComponent,
        DetailCardComponent,
        InheritedCardComponent,
        HostDirDemoComponent,
        ViewProvidersDemoComponent,
        HighlightDirective,
        TooltipDirective,
        AutofocusDirective,
        DebounceClickDirective,
        FirstUpperPipe,
        TruncatePipe,
        TimeAgoPipe,
        FileSizePipe,
        SafeHtmlPipe,
    ],
})
export class SharedModule {}
