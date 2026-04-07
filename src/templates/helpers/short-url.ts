/** Shorten a file path: keep first segment + ... + last segment. */
export const shortUrl = (url: string): string => {
    const first = url.indexOf('/');
    const last = url.lastIndexOf('/');
    if (first !== -1 || last !== -1) {
        return url.substring(0, first + 1) + '...' + url.substring(last);
    }
    return url;
};

/** Shorten a file path to start from the first "src" segment, or last 3 segments. */
export const shortPath = (filePath: string): string => {
    const parts = filePath.replace(/\\/g, '/').split('/');
    const srcIdx = parts.lastIndexOf('src');
    if (srcIdx >= 0) return parts.slice(srcIdx).join('/');
    return parts.length <= 3 ? parts.join('/') : parts.slice(-3).join('/');
};
