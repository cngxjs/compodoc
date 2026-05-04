/** Render a package.json property value as HTML string. */
export const parseProperty = (value: unknown): string => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        if (obj['url'] !== undefined) {
            return String(obj['url']);
        }
        if (obj['name'] !== undefined) {
            return String(obj['name']);
        }
        if (Object.keys(obj).length === 0) {
            return '';
        }
    }

    if (typeof value === 'string' && value !== '' && value.includes('https')) {
        return `<a href="${value}" target="_blank">${value}</a>`;
    }

    if (Array.isArray(value) && value.length > 0) {
        return value.join(', ');
    }

    return String(value ?? '');
};
