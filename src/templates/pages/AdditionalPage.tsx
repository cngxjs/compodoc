import Html from '@kitajs/html';

type AdditionalPageProps = {
    readonly additionalPage: string;
};

export const AdditionalPage = (props: AdditionalPageProps): string =>
    (props.additionalPage ?? '') as string;
