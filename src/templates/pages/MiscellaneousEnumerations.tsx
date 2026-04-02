import Html from '@kitajs/html';
import { t } from '../helpers';
import { BlockEnum } from '../blocks/BlockEnum';
import { IndexMisc } from '../blocks/IndexMisc';

type MiscEnumerationsProps = {
    readonly miscellaneous: {
        readonly enumerations: any[];
        readonly groupedEnumerations: Record<string, any[]>;
    };
    readonly depth?: number;
};

export const MiscellaneousEnumerations = (props: MiscEnumerationsProps): string => (
    <>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('miscellaneous')}</li>
            <li class="breadcrumb-item">{t('enumerations')}</li>
        </ol>
        {IndexMisc({ list: props.miscellaneous.enumerations })}
        {Object.entries(props.miscellaneous.groupedEnumerations).map(([key, enums]) => (<>
            <h3>{key}</h3>
            {BlockEnum({ enums, depth: props.depth })}
        </>))}
    </>
) as string;
