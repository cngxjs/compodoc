import Html from '@kitajs/html';
import { AiGeneratedBadge } from '../components/AiGeneratedBadge';

type MarkdownProps = {
    readonly markdown: string;
    readonly aiGenerated?: string | true | false;
};

export const Markdown = (props: MarkdownProps): string =>
    (
        <div class="cdx-prose">
            {props.aiGenerated ? (
                <div class="cdx-ai-generated-banner">
                    {AiGeneratedBadge({ aiGenerated: props.aiGenerated })}
                </div>
            ) : (
                ''
            )}
            {props.markdown ?? ''}
        </div>
    ) as string;
