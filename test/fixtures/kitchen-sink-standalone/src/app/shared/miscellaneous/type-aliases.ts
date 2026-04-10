import { Todo } from '../models/todo.model';
import { User } from '../models/user.model';

/**
 * Single or array.
 */
export type OneOrMany<T> = T | T[];

/**
 * Keys of T with values of type V.
 */
export type KeysOfType<T, V> = {
    [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Deep partial.
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Nullable wrapper.
 */
export type Nullable<T> = T | null;

/**
 * Primitive types.
 */
export type Primitive = string | number | boolean | null | undefined;

/**
 * Comparator function.
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * Predicate function.
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * Constructor type.
 */
export type Constructor<T = unknown> = new (...args: unknown[]) => T;

/**
 * Complex union.
 */
export type TodoOrUser = Todo | User;

/**
 * Intersection type.
 */
export type TimestampedTodo = Todo & { createdAt: Date; updatedAt: Date };

/**
 * @deprecated Use [number, number] directly.
 */
export type LinearDomain = [number, number];
