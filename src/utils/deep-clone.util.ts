/**
 * Deep clone that handles circular references and function properties
 * (which structuredClone and JSON.stringify cannot).
 */
export function deepClone<T>(obj: T): T {
    const seen = new WeakSet();
    return JSON.parse(
        JSON.stringify(obj, (_key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return undefined;
                }
                seen.add(value);
            }
            if (typeof value === 'function') {
                return undefined;
            }
            return value;
        })
    );
}
