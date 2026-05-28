import type { JsdocParserUtil } from '../../../utils';

export class JsdocTags {
    constructor(private readonly jsdocParserUtil: JsdocParserUtil) {}

    public checkForDeprecation(tags: any[], result: { [key in string | number]: any }) {
        tags.forEach(tag => {
            if (tag.tagName?.text) {
                if (tag.tagName.text.includes('deprecated')) {
                    result.deprecated = true;
                    // tag.comment becomes a NodeArray (not a string) when the
                    // JSDoc has an inline {@link X}; parseJSDocNode flattens both shapes.
                    result.deprecationMessage = this.jsdocParserUtil.parseJSDocNode(tag) || '';
                }
                if (tag.tagName.text === 'category') {
                    result.category = (this.jsdocParserUtil.parseJSDocNode(tag) || '').trim();
                }
                if (tag.tagName.text === 'docsKind') {
                    const raw = (this.jsdocParserUtil.parseJSDocNode(tag) || '').trim();
                    const value = raw.split('\n')[0].trim().toLowerCase();
                    if (value === 'primary') {
                        result.docsKind = 'primary';
                    }
                }
            }
        });
        this.extractCustomTags(tags, result);
    }

    public extractCustomTags(tags: any[], result: { [key in string | number]: any }) {
        for (const tag of tags) {
            if (!tag.tagName?.text) {
                continue;
            }
            const name = tag.tagName.text;
            const rawComment = tag.comment;
            const comment = (
                typeof rawComment === 'string'
                    ? rawComment
                    : Array.isArray(rawComment)
                      ? rawComment.map((c: any) => c.text || '').join('')
                      : ''
            ).trim();

            switch (name) {
                case 'signal':
                    result.signal = true;
                    break;
                case 'zoneless':
                    result.zoneless = true;
                    break;
                case 'beta':
                    result.beta = true;
                    break;
                case 'group':
                    result.group = comment.split('\n')[0].trim();
                    break;
                case 'order':
                    result.order = Number.parseInt(comment, 10) || 0;
                    break;
                case 'since':
                    result.since = comment.split('\n')[0].trim();
                    break;
                case 'breaking':
                    result.breaking = comment.split('\n')[0].trim();
                    break;
                case 'aiGenerated':
                    result.aiGenerated = comment.split('\n')[0].trim() || true;
                    break;
                case 'route':
                    result.route = comment.split('\n')[0].trim();
                    break;
                case 'storybook':
                    result.storybookUrl = comment.split('\n')[0].trim();
                    break;
                case 'figma':
                    result.figmaUrl = comment.split('\n')[0].trim();
                    break;
                case 'stackblitz':
                    result.stackblitzUrl = comment.split('\n')[0].trim();
                    break;
                case 'github':
                    result.githubUrl = comment.split('\n')[0].trim();
                    break;
                case 'docs':
                    result.docsUrl = comment.split('\n')[0].trim();
                    break;
                case 'slot': {
                    // @slot name - description
                    if (!result.slots) {
                        result.slots = [];
                    }
                    const parts = comment.match(/^(\S+)\s*-?\s*(.*)$/);
                    if (parts) {
                        result.slots.push({
                            name: parts[1],
                            description: parts[2] || ''
                        });
                    } else if (comment) {
                        result.slots.push({ name: comment, description: '' });
                    }
                    break;
                }
            }
        }
    }
}
