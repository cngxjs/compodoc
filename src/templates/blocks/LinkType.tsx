import Html from '@kitajs/html';
import { linkTypeHtml } from '../helpers';

type LinkTypeProps = {
    readonly type: string;
    readonly withLine?: boolean;
    readonly line?: number;
    readonly indexKey?: string;
};

export const LinkType = (props: LinkTypeProps): string =>
    linkTypeHtml(props.type, {
        withLine: props.withLine,
        line: props.line,
        indexKey: props.indexKey,
    });
