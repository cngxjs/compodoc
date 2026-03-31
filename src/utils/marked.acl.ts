import { marked } from 'marked';

marked.use({
    mangle: false,
    headerIds: false
});

export const markedAcl = marked;
