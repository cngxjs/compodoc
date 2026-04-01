import Html from '@kitajs/html';

type MarkdownProps = {
    readonly markdown: string;
};

export const Markdown = (props: MarkdownProps): string =>
    (props.markdown ?? '') as string;
