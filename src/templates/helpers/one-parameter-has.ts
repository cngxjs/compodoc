/** Check if any item in a tags array has a non-empty value for the given property. */
export const oneParameterHas = (tags: Record<string, unknown>[], prop: string): boolean =>
    tags.some(tag => tag[prop] !== undefined && tag[prop] !== '');
