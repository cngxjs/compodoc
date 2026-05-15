import Html from '@kitajs/html';
import { AiGeneratedBadge } from '../components/AiGeneratedBadge';

type AdditionalPageProps = {
    readonly additionalPage: string;
    readonly aiGenerated?: string | true | false;
};

export const AdditionalPage = (props: AdditionalPageProps): string =>
    (
        <div class="cdx-readme">
            {props.aiGenerated ? (
                <div class="cdx-ai-generated-banner">
                    {AiGeneratedBadge({ aiGenerated: props.aiGenerated })}
                </div>
            ) : (
                ''
            )}
            {(props.additionalPage ?? '') as string}
        </div>
    ) as string;
