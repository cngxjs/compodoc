import { Todo } from '../../core/models/todo.model';
import { User } from '../../core/models/user.model';

/**
 * A type that can be either a single value or an array.
 */
export type OneOrMany<T> = T | T[];

/**
 * Extract the keys of T that have values assignable to V.
 */
export type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Make specific properties of T required.
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make all properties of T mutable (remove readonly).
 */
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

/**
 * Deep partial — makes all nested properties optional.
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * A callback function type.
 */
export type Callback<T = void> = (result: T) => void;

/**
 * An async callback function type.
 */
export type AsyncCallback<T = void> = (result: T) => Promise<void>;

/**
 * Nullable type wrapper.
 */
export type Nullable<T> = T | null;

/**
 * Union type for primitive values.
 */
export type Primitive = string | number | boolean | null | undefined;

/**
 * A dictionary with string keys.
 */
export type Dictionary<T = unknown> = Record<string, T>;

/**
 * Extract the resolved type of a Promise.
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * A comparator function for sorting.
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * Predicate function type.
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * A type representing the constructor of a class.
 */
export type Constructor<T = unknown> = new (...args: unknown[]) => T;

/**
 * A linear domain mapping — used for chart axes.
 *
 * @deprecated Use `[number, number]` directly.
 */
export type LinearDomain = [number, number];

/**
 * A render function type for table cells.
 */
export type CellRenderer<T> = (value: unknown, row: T, columnKey: string) => string;

/**
 * A type with index signatures demonstrating various patterns.
 */
export type StringIndexed = {
    [key: string]: unknown;
    name: string;
    id: number;
};

/**
 * Complex union type.
 */
export type TodoOrUser = Todo | User;

/**
 * Intersection type.
 */
export type TimestampedTodo = Todo & { createdAt: Date; updatedAt: Date };
