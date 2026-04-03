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
        <ol class="cdx-breadcrumb">
            <li class="">{t('miscellaneous')}</li>
            <li class="">{t('type-aliases')}</li>
        </ol>
        {IndexMisc({ list: props.miscellaneous.typealiases })}
        {Object.entries(props.miscellaneous.groupedTypeAliases).map(([key, typealias]) => (<>
            <h3>{key}</h3>
            {BlockTypealias({ typealias, depth: props.depth })}
        </>))}
    </>
) as string;
