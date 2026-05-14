/**
 * Result<T, E> — discriminated-union return type for operations that can fail.
 * Replaces `process.exit(2)` / throw-on-validation-error patterns at module
 * boundaries. Callers narrow with `isOk` / `isErr` before consuming.
 */
export type Result<T, E = string> =
    | { readonly ok: true; readonly value: T }
    | { readonly ok: false; readonly message: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(message: E): Result<never, E> => ({ ok: false, message });

export const isOk = <T, E>(r: Result<T, E>): r is { readonly ok: true; readonly value: T } => r.ok;

export const isErr = <T, E>(r: Result<T, E>): r is { readonly ok: false; readonly message: E } =>
    !r.ok;

export const mapResult = <T, U, E>(r: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
    if (isOk(r)) {
        return ok(fn(r.value));
    }
    return err(r.message);
};
