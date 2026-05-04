export class UndocumentedClass {
    name: string = '';
    value: number = 0;
    active: boolean = false;

    process(): void {}
    validate(): boolean { return true; }

    get summary(): string { return `${this.name}: ${this.value}`; }
    set summary(val: string) { this.name = val; }

    private internal(): void {}
    protected helper(): void {}
}

export interface UndocumentedInterface {
    x: number;
    y: number;
    transform(factor: number): UndocumentedInterface;
}

export enum UndocumentedEnum {
    Alpha,
    Beta,
    Gamma,
}

export type UndocumentedAlias = string | number;
export function undocumentedFn(a: number): number { return a * 2; }
export const UNDOC_CONST = 99;
