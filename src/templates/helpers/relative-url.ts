/**
 * Generate a relative URL prefix based on the current page depth.
 * Equivalent to the Handlebars {{relativeURL}} helper.
 */
export const relativeUrl = (depth: number, path: string = ''): string => {
    const prefix = depth === 0 ? './' : '../'.repeat(depth);
    return prefix + path;
};
