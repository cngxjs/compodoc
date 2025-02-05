import { Component, EventEmitter, Input, input, Output, output, model } from '@angular/core';

/**
 * FooComponent description
 *
 * See {@link AppModule|APP}
 */
@Component({
    selector: 'app-foo',
    styles: [
        `
            .host {
                width: 100%;
                height: 4px;
                top: 0;
                position: fixed;
                left: 0px;
            }
        `
    ],
    template: `
        <div class="host">
            <div (click)="exampleOutput.emit({ foo: 'bar' })"></div>
        </div>
    `
})
export class FooComponent {
    /**
     * An example input
     * {@link BarComponent} or [BarComponent2]{@link BarComponent} or {@link BarComponent|BarComponent3}
     */
    @Input() exampleInput: string = 'foo';

    /**
     * An example required input
     */
    @Input({ required: true }) requiredInput: string;

    /**
     * An example aliased input
     */
    @Input('aliasedInput') aliasedInput: string;

    /**
     * An example aliased input using the object syntax
     */
    @Input({ alias: 'aliasedInputObjectSyntax' }) objectAliasedInput: string;

    /**
     * An example aliased required input using the object syntax
     */
    @Input({ alias: 'aliasedAndRequiredInput', required: true }) aliasedAndRequired: string;

    /**
     * An example output
     */
    @Output() exampleOutput: EventEmitter<{ foo: string }> = new EventEmitter();

    /**
     * An example input signal
     */
    public readonly inputSignal = input<'foo' | 'bar'>('foo');

    /**
     * An example required input signal
     */
    public readonly requiredInputSignal = input.required<string>('foo');

    /**
     * An example aliased input signal
     */
    public readonly aliasedInputSignal = input(null, { alias: 'aliasedInSignal' });

    /**
     * An example output signal
     */
    public readonly outputSignal = output<'foo' | 'bar'>('foo');

    /**
     * An example required output signal
     */
    public readonly requiredOutputSignal = output.required<string>('foo');

    /**
     * An example aliased output signal
     */
    public readonly aliasedOutputSignal = output(null, { alias: 'aliasedOutSignal' });

    /**
     * An example model input signal
     */
    public readonly modelInputSignal = model(0);

    /**
     * constructor description
     * @param  {boolean} myprop description
     */
    constructor(public myprop: boolean) {}
}
