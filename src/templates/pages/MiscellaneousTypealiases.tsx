import Html from '@kitajs/html';
import { t } from '../helpers';
import { BlockTypealias } from '../blocks/BlockTypealias';
import { IndexMisc } from '../blocks/IndexMisc';

type MiscTypealiasesProps = {
    readonly miscellaneous: {
        readonly typealiases: any[];
        readonly groupedTypeAliases: Record<string, any[]>;
    };
    readonly depth?: number;
};

export const MiscellaneousTypealiases = (props: MiscTypealiasesProps): string => (
    <>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('miscellaneous')}</li>
            <li class="breadcrumb-item">{t('type-aliases')}</li>
        </ol>
        {IndexMisc({ list: props.miscellaneous.typealiases })}
        {Object.entries(props.miscellaneous.groupedTypeAliases).map(([key, typealias]) => (<>
            <h3>{key}</h3>
            {BlockTypealias({ typealias, depth: props.depth })}
        </>))}
    </>
) as string;
