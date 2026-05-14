/**
 * Left-to-right function composition.
 *
 * `pipe(x, f, g, h)` is `h(g(f(x)))`. Overloads inferred up to 9 functions;
 * beyond 9 args, callers split into nested pipes. Cap matches fp-ts / ramda.
 */
export function pipe<A>(a: A): A;
export function pipe<A, B>(a: A, ab: (a: A) => B): B;
export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
export function pipe<A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
export function pipe<A, B, C, D, E>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E
): E;
export function pipe<A, B, C, D, E, F>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F
): F;
export function pipe<A, B, C, D, E, F, G>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G
): G;
export function pipe<A, B, C, D, E, F, G, H>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H
): H;
export function pipe<A, B, C, D, E, F, G, H, I>(
    a: A,
    ab: (a: A) => B,
    bc: (b: B) => C,
    cd: (c: C) => D,
    de: (d: D) => E,
    ef: (e: E) => F,
    fg: (f: F) => G,
    gh: (g: G) => H,
    hi: (h: H) => I
): I;
export function pipe(value: unknown, ...fns: Array<(x: unknown) => unknown>): unknown {
    return fns.reduce((acc, fn) => fn(acc), value);
}

/**
 * Async left-to-right composition. Each step may return `T` or `Promise<T>`;
 * the next step's input is the resolved value of the previous step. Same
 * 9-arg cap as `pipe`. Rejections propagate.
 */
export function pipeAsync<A>(a: A): Promise<A>;
export function pipeAsync<A, B>(a: A, ab: (a: A) => B | Promise<B>): Promise<B>;
export function pipeAsync<A, B, C>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>
): Promise<C>;
export function pipeAsync<A, B, C, D>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>
): Promise<D>;
export function pipeAsync<A, B, C, D, E>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>
): Promise<E>;
export function pipeAsync<A, B, C, D, E, F>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>,
    ef: (e: E) => F | Promise<F>
): Promise<F>;
export function pipeAsync<A, B, C, D, E, F, G>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>,
    ef: (e: E) => F | Promise<F>,
    fg: (f: F) => G | Promise<G>
): Promise<G>;
export function pipeAsync<A, B, C, D, E, F, G, H>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>,
    ef: (e: E) => F | Promise<F>,
    fg: (f: F) => G | Promise<G>,
    gh: (g: G) => H | Promise<H>
): Promise<H>;
export function pipeAsync<A, B, C, D, E, F, G, H, I>(
    a: A,
    ab: (a: A) => B | Promise<B>,
    bc: (b: B) => C | Promise<C>,
    cd: (c: C) => D | Promise<D>,
    de: (d: D) => E | Promise<E>,
    ef: (e: E) => F | Promise<F>,
    fg: (f: F) => G | Promise<G>,
    gh: (g: G) => H | Promise<H>,
    hi: (h: H) => I | Promise<I>
): Promise<I>;
export async function pipeAsync(
    value: unknown,
    ...fns: Array<(x: unknown) => unknown | Promise<unknown>>
): Promise<unknown> {
    let acc: unknown = value;
    for (const fn of fns) {
        acc = await fn(acc);
    }
    return acc;
}
