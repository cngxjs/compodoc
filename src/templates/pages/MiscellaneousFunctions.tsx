import Html from '@kitajs/html';
import { t } from '../helpers';
import { BlockMethod } from '../blocks/BlockMethod';
import { IndexMisc } from '../blocks/IndexMisc';

type MiscFunctionsProps = {
    readonly miscellaneous: {
        readonly functions: any[];
        readonly groupedFunctions: Record<string, any[]>;
    };
    readonly depth?: number;
};

export const MiscellaneousFunctions = (props: MiscFunctionsProps): string => (
    <>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('miscellaneous')}</li>
            <li class="breadcrumb-item">{t('functions')}</li>
        </ol>
        {IndexMisc({ list: props.miscellaneous.functions })}
        {Object.entries(props.miscellaneous.groupedFunctions).map(([key, methods]) => (<>
            <h3>{key}</h3>
            {BlockMethod({ methods, title: '', file: '', depth: props.depth })}
        </>))}
    </>
) as string;
