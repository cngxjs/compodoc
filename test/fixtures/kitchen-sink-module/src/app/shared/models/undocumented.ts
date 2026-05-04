export class UndocumentedClass {
    name: string = '';
    value: number = 0;
    items: string[] = [];

    getData(): string {
        return this.name;
    }

    setData(name: string, value: number): void {
        this.name = name;
        this.value = value;
    }

    processItems(callback: (item: string) => void): void {
        this.items.forEach(callback);
    }

    get fullInfo(): string {
        return `${this.name}: ${this.value}`;
    }

    set fullInfo(val: string) {
        const parts = val.split(':');
        this.name = parts[0]?.trim() ?? '';
        this.value = Number(parts[1]?.trim() ?? 0);
    }

    private internalMethod(): void {}
    protected helperMethod(): boolean { return true; }
}

export interface UndocumentedInterface {
    x: number;
    y: number;
    label?: string;
    calculate(factor: number): number;
}

export enum UndocumentedEnum {
    First,
    Second,
    Third,
}

export type UndocumentedAlias = string | number | boolean;

export function undocumentedFunction(a: number, b: number): number {
    return a + b;
}

export const UNDOCUMENTED_CONST = 42;

export const UNDOCUMENTED_ARRAY = [1, 2, 3, 4, 5];
