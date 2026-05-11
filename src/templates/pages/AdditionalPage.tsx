import Html from '@kitajs/html';

type AdditionalPageProps = {
    readonly additionalPage: string;
};

export const AdditionalPage = (props: AdditionalPageProps): string =>
    (<div class="content-data cdx-readme">{(props.additionalPage ?? '') as string}</div>) as string;
