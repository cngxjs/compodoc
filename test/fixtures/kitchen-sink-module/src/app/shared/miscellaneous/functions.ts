import { SupportedLocale } from './constants';

/**
 * Deep-clone an object using structured serialization.
 *
 * @param value - The value to clone
 * @returns A deep copy of the value
 *
 * @example
 * ```typescript
 * const clone = deepClone({ nested: { value: 42 } });
 * ```
 *
 * @since 1.0.0
 */
export function deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

/**
 * Generate a UUID v4 string.
 *
 * @returns A random UUID
 *
 * @example
 * ```typescript
 * const id = generateUuid(); // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 * ```
 */
export function generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Debounce a function call.
 *
 * @param fn - The function to debounce
 * @param delay - The debounce delay in ms
 * @returns The debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Throttle a function to execute at most once per interval.
 *
 * @param fn - The function to throttle
 * @param interval - Minimum interval between calls in ms
 * @returns The throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    interval: number
): (...args: Parameters<T>) => void {
    let lastTime = 0;
    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastTime >= interval) {
            lastTime = now;
            fn(...args);
        }
    };
}

/**
 * Check if a value is not null and not undefined.
 *
 * @param value - The value to check
 * @returns True if the value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

/**
 * Group an array by a key extracted from each element.
 *
 * @param items - The array to group
 * @param keyFn - Function to extract the group key
 * @returns A map of key to items
 *
 * @example
 * ```typescript
 * const grouped = groupBy(users, u => u.role);
 * ```
 */
export function groupBy<T, K extends string | number>(
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
 * Clamp a number between a minimum and maximum.
 *
 * @param value - The value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Format a number as a locale-aware string.
 *
 * @param value - The number to format
 * @param locale - The locale to use
 * @param options - Intl.NumberFormat options
 * @returns Formatted string
 *
 * @deprecated Use `Intl.NumberFormat` directly.
 */
export function formatNumber(
    value: number,
    locale: SupportedLocale = 'en-US',
    options?: Intl.NumberFormatOptions
): string {
    return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * No-op function — does nothing.
 *
 * @example
 * ```typescript
 * const callback = noop;
 * ```
 */
export function noop(): void {}

/**
 * Identity function — returns the input unchanged.
 *
 * @param value - Any value
 * @returns The same value
 */
export function identity<T>(value: T): T {
    return value;
}

/**
 * Unnamed export demonstrating anonymous function documentation.
 */
export default function (x: number, y: number): number {
    return x + y;
}
