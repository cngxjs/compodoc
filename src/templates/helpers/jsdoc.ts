import { kindToType } from '../../utils/kind-to-type';

export type JsdocTag = {
    name?: string;
    type?: string;
    comment?: string;
    defaultValue?: string;
    optional?: boolean;
    [key: string]: unknown;
};

/** Check if any JSDoc tag is a @param tag. */
export const hasJsdocParams = (tags: any[]): boolean =>
    tags.some(tag => tag.tagName?.text === 'param');

/** Extract structured @param tags from JSDoc. */
export const extractJsdocParams = (jsdocTags: any[]): JsdocTag[] => {
    const tags: JsdocTag[] = [];
    for (const jt of jsdocTags) {
        if (jt.tagName?.text !== 'param') continue;

        const tag: JsdocTag = {};
        if (jt.typeExpression?.type?.name) {
            tag.type = jt.typeExpression.type.name.text;
        } else if (jt.typeExpression?.type?.kind) {
            tag.type = kindToType(jt.typeExpression.type.kind);
        } else {
            tag.type = jt.type;
        }
        if (jt.comment) tag.comment = jt.comment;
        if (jt.defaultValue) tag.defaultValue = jt.defaultValue;
        tag.name = jt.name?.text ?? jt.name;
        if (jt.optional) tag.optional = true;
        tags.push(tag);
    }
    return tags;
};

function htmlEntities(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

type CodeBlock = { language: string; code: string };

function parseCodeFences(comment: string): CodeBlock[] {
    const regex = /```(\w+)?\s*\n([\s\S]*?)```/g;
    const blocks: CodeBlock[] = [];
    let match: RegExpExecArray | null;
    let hasCodeFences = false;

    while ((match = regex.exec(comment)) !== null) {
        hasCodeFences = true;
        let lang = (match[1] || 'html').toLowerCase();
        if (lang === 'js') lang = 'javascript';
        if (lang === 'ts') lang = 'typescript';
        let code = match[2].replace(/___COMPODOC_EMPTY_LINE___/g, '\n').trim();
        code = code.replace(/```[\s\S]*?```/g, '');
        if (code.length > 0) blocks.push({ language: lang, code });
    }

    if (!hasCodeFences) {
        const trimmed = comment.trim();
        if (trimmed.length > 0) blocks.push({ language: 'html', code: trimmed });
    }
    return blocks;
}

/** Extract @example tags with code fence parsing (rendered as <pre><code>). */
export const extractJsdocCodeExamples = (jsdocTags: any[]): JsdocTag[] => {
    const tags: JsdocTag[] = [];
    for (const jt of jsdocTags) {
        if (jt.tagName?.text !== 'example' || !jt.comment) continue;

        let comment = jt.comment;
        const captionMatch = comment.match(/<caption>([\s\S]*?)<\/caption>/);
        if (captionMatch) {
            tags.push({ comment: `<b><i>${captionMatch[1]}</i></b>` });
            comment = comment.replace(/<caption>[\s\S]*?<\/caption>/, '').trim();
        }

        for (const block of parseCodeFences(comment)) {
            tags.push({
                comment: `<pre class="line-numbers"><code class="language-${block.language}">${htmlEntities(block.code)}</code></pre>`,
            });
        }
    }
    return tags;
};

/** Extract @example tags (simple — caption replacement only). */
export const extractJsdocExamples = (jsdocTags: any[]): JsdocTag[] => {
    const tags: JsdocTag[] = [];
    for (const jt of jsdocTags) {
        if (jt.tagName?.text !== 'example') continue;
        const comment = (jt.comment ?? '')
            .replace(/<caption>/g, '<b><i>')
            .replace(/\/caption>/g, '/b></i>');
        tags.push({ comment });
    }
    return tags;
};

/** Get the comment from the first @returns/@return tag. */
export const jsdocReturnsComment = (jsdocTags: any[]): string => {
    for (const jt of jsdocTags) {
        if (jt.tagName?.text === 'returns' || jt.tagName?.text === 'return') {
            return jt.comment ?? '';
        }
    }
    return '';
};
