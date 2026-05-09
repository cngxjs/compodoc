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
        if (jt.tagName?.text !== 'param') {
            continue;
        }

        const tag: JsdocTag = {};
        if (jt.typeExpression?.type?.name) {
            tag.type = jt.typeExpression.type.name.text;
        } else if (jt.typeExpression?.type?.kind) {
            tag.type = kindToType(jt.typeExpression.type.kind);
        } else {
            tag.type = jt.type;
        }
        if (jt.comment) {
            tag.comment = jt.comment;
        }
        if (jt.defaultValue) {
            tag.defaultValue = jt.defaultValue;
        }
        tag.name = jt.name?.text ?? jt.name;
        if (jt.optional) {
            tag.optional = true;
        }
        tags.push(tag);
    }
    return tags;
};

function htmlEntities(str: string): string {
    return str
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
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
        if (lang === 'js') {
            lang = 'javascript';
        }
        if (lang === 'ts') {
            lang = 'typescript';
        }
        let code = match[2].replaceAll('___COMPODOC_EMPTY_LINE___', '\n').trim();
        code = code.replaceAll(/```[\s\S]*?```/g, '');
        if (code.length > 0) {
            blocks.push({ language: lang, code });
        }
    }

    if (!hasCodeFences) {
        const trimmed = comment.trim();
        if (trimmed.length > 0) {
            blocks.push({ language: 'html', code: trimmed });
        }
    }
    return blocks;
}

/** Extract @example tags with code fence parsing (rendered as <pre><code>). */
export const extractJsdocCodeExamples = (jsdocTags: any[]): JsdocTag[] => {
    const tags: JsdocTag[] = [];
    for (const jt of jsdocTags) {
        if (jt.tagName?.text !== 'example' || !jt.comment) {
            continue;
        }

        let comment = jt.comment;
        const captionMatch = comment.match(/<caption>([\s\S]*?)<\/caption>/);
        if (captionMatch) {
            tags.push({ comment: `<b><i>${captionMatch[1]}</i></b>` });
            comment = comment.replace(/<caption>[\s\S]*?<\/caption>/, '').trim();
        }

        for (const block of parseCodeFences(comment)) {
            tags.push({
                comment: `<pre class="cdx-code-example"><code class="language-${block.language}">${htmlEntities(block.code)}</code></pre>`
            });
        }
    }
    return tags;
};

/** Extract @example tags (simple — caption replacement only). */
export const extractJsdocExamples = (jsdocTags: any[]): JsdocTag[] => {
    const tags: JsdocTag[] = [];
    for (const jt of jsdocTags) {
        if (jt.tagName?.text !== 'example') {
            continue;
        }
        const comment = (jt.comment ?? '')
            .replaceAll('<caption>', '<b><i>')
            .replaceAll('/caption>', '/b></i>');
        tags.push({ comment });
    }
    return tags;
};

/**
 * One runnable playground block parsed from a `@playground <title>` JSDoc tag.
 * Surfaced on `IComponentDep.playgrounds` and consumed by the StackBlitz
 * project-builder. The `line` field is a zero-based offset relative to the
 * start of the source `tag.comment` text, pointing at the fence-open line.
 */
export type ComponentPlaygroundBlock = {
    title: string;
    snippet: string;
    language: string;
    line: number;
};

const FENCE_BLOCK_REGEX = /```(\w+)?[ \t]*\r?\n([\s\S]*?)```/;

const readTagComment = (tag: any): string => {
    const c = tag?.comment;
    if (typeof c === 'string') {
        return c;
    }
    if (Array.isArray(c)) {
        return c.map((part: any) => part?.text ?? '').join('');
    }
    return '';
};

/**
 * Parse `@playground <title>` JSDoc blocks. Each block becomes one runnable
 * section on the Playground tab. Title is required; missing titles or unfenced
 * bodies produce a warning and the block is silently dropped.
 *
 * Returns the parsed blocks plus a list of warnings the caller can route to
 * `logger.warn`. No `console.log` inside this helper (build-path discipline).
 */
export const extractJsdocPlaygroundBlocks = (
    jsdocTags: any[]
): { blocks: ComponentPlaygroundBlock[]; warnings: string[] } => {
    const blocks: ComponentPlaygroundBlock[] = [];
    const warnings: string[] = [];
    if (!Array.isArray(jsdocTags)) {
        return { blocks, warnings };
    }

    for (const jt of jsdocTags) {
        if (jt?.tagName?.text !== 'playground') {
            continue;
        }
        const raw = readTagComment(jt);
        const lines = raw.split(/\r?\n/);

        // Title is the first non-empty line (TS strips the @tag prefix and
        // leaves everything after `@playground ` in `comment`).
        let titleLine = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().length > 0) {
                titleLine = i;
                break;
            }
        }
        if (titleLine === -1 || lines[titleLine].trim().startsWith('```')) {
            warnings.push('@playground block dropped: missing title');
            continue;
        }

        const title = lines[titleLine].trim();
        const fenceSearch = lines.slice(titleLine + 1).join('\n');
        const fenceMatch = fenceSearch.match(FENCE_BLOCK_REGEX);
        if (!fenceMatch) {
            warnings.push(`@playground block "${title}" dropped: no fenced code body`);
            continue;
        }

        let language = (fenceMatch[1] || 'html').toLowerCase();
        if (language === 'js') {
            language = 'javascript';
        }
        if (language === 'ts') {
            language = 'typescript';
        }
        const snippet = fenceMatch[2].replaceAll('___COMPODOC_EMPTY_LINE___', '\n').trimEnd();

        // Fence-open line, zero-indexed against the start of `tag.comment`.
        const fenceOffset = fenceSearch.slice(0, fenceMatch.index ?? 0).split('\n').length - 1;
        const line = titleLine + 1 + fenceOffset;

        blocks.push({ title, snippet, language, line });
    }
    return { blocks, warnings };
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
