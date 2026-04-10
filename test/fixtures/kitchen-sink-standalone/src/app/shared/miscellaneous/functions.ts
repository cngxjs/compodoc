/**
 * Deep clone via JSON serialization.
 *
 * @param value - Value to clone
 * @returns Cloned value
 *
 * @example
 * ```typescript
 * const copy = deepClone({ a: 1 });
 * ```
 */
export function deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

/**
 * Generate a UUID v4.
 *
 * @returns Random UUID string
 */
export function generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

/**
 * Debounce a function.
 *
 * @param fn - Function to debounce
 * @param delay - Delay in ms
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Type guard for non-null values.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

/**
 * Group items by key.
 */
export function groupBy<T, K extends string>(
    items: T[],
    keyFn: (item: T) => K
): Record<K, T[]> {
    return items.reduce(
        (acc, item) => {
            const key = keyFn(item);
            (acc[key] ??= []).push(item);
            return acc;
        },
        {} as Record<K, T[]>
    );
}

/**
 * Clamp a number.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * No-op function.
 */
export function noop(): void {}

/**
 * Identity function.
 */
export function identity<T>(value: T): T {
    return value;
}

/**
 * Anonymous default export.
 */
export default function (x: number, y: number): number {
    return x * y;
}
