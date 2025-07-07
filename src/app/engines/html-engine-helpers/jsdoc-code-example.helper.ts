import { IHtmlEngineHelper, IHandlebarsOptions } from './html-engine-helper.interface';
import { JsdocTagInterface } from '../../interfaces/jsdoc-tag.interface';

interface CodeBlock {
    language: string;
    code: string;
}

export class JsdocCodeExampleHelper implements IHtmlEngineHelper {
    private cleanTag(comment: string): string {
        if (comment.charAt(0) === '*') {
            comment = comment.substring(1, comment.length);
        }
        if (comment.charAt(0) === ' ') {
            comment = comment.substring(1, comment.length);
        }
        if (comment.indexOf('<p>') === 0) {
            comment = comment.substring(3, comment.length);
        }
        if (comment.substr(-1) === '\n') {
            comment = comment.substring(0, comment.length - 1);
        }
        if (comment.substr(-4) === '</p>') {
            comment = comment.substring(0, comment.length - 4);
        }
        return comment;
    }

    private getHtmlEntities(str): string {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private parseCodeFences(comment: string): CodeBlock[] {
        const codeFenceRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
        const blocks: CodeBlock[] = [];
        let match;
        let hasCodeFences = false;

        // Find all code fences
        while ((match = codeFenceRegex.exec(comment)) !== null) {
            hasCodeFences = true;
            const language = match[1] || 'html';
            let code = match[2];

            // Trim whitespace from the code
            code = code.trim();

            // Skip empty code blocks
            if (code.length === 0) {
                continue;
            }

            blocks.push({
                language: language,
                code: code
            });
        }

        // If no code fences found, treat entire comment as plain text with html language
        if (!hasCodeFences) {
            const trimmedComment = comment.trim();
            if (trimmedComment.length > 0) {
                blocks.push({
                    language: 'html',
                    code: trimmedComment
                });
            }
        }

        return blocks;
    }

    public helperFunc(context: any, jsdocTags: JsdocTagInterface[], options: IHandlebarsOptions) {
        let i = 0;
        const len = jsdocTags.length;
        const tags = [];

        for (i; i < len; i++) {
            if (jsdocTags[i].tagName) {
                if (jsdocTags[i].tagName.text === 'example') {
                    if (jsdocTags[i].comment) {
                        const comment = jsdocTags[i].comment;

                        // Handle captions
                        if (comment.indexOf('<caption>') !== -1) {
                            const tag = {} as JsdocTagInterface;
                            tag.comment = comment
                                .replace(/<caption>/g, '<b><i>')
                                .replace(/<\/caption>/g, '</i></b>');
                            tags.push(tag);
                        } else {
                            // Parse code fences
                            const codeBlocks = this.parseCodeFences(comment);

                            // Create a tag for each code block
                            for (const block of codeBlocks) {
                                const tag = {} as JsdocTagInterface;
                                tag.comment =
                                    `<pre class="line-numbers"><code class="language-${block.language}">` +
                                    this.getHtmlEntities(block.code) +
                                    `</code></pre>`;
                                tags.push(tag);
                            }
                        }
                    }
                }
            }
        }

        if (tags.length > 0) {
            context.tags = tags;
            return options.fn(context);
        }
    }
}
