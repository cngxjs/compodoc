import Html from '@kitajs/html';

type MarkdownProps = {
    readonly markdown: string;
};

export const Markdown = (props: MarkdownProps): string =>
    (<div class="cdx-prose">{props.markdown ?? ''}</div>) as string;
