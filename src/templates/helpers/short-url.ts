/** Shorten a file path: keep first segment + ... + last segment. */
export const shortUrl = (url: string): string => {
    const first = url.indexOf('/');
    const last = url.lastIndexOf('/');
    if (first !== -1 || last !== -1) {
        return url.substring(0, first + 1) + '...' + url.substring(last);
    }
    return url;
};
