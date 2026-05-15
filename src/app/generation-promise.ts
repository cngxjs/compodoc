// Module-level promise that gates the CLI exit. Lives in its own module so
// both the application orchestrator and the coverage page generator (which
// resolves or rejects based on threshold gates) can import without creating
// a circular dependency.

let generationPromiseResolve: (value: unknown) => void;
let generationPromiseReject: () => void;

export const generationPromise: Promise<unknown> = new Promise((resolve, reject) => {
    generationPromiseResolve = resolve;
    generationPromiseReject = reject;
});

export function resolveGenerationPromise(value: unknown = true): void {
    generationPromiseResolve(value);
}

export function rejectGenerationPromise(): void {
    generationPromiseReject();
}
