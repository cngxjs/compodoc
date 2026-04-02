import Html from '@kitajs/html';
import { t } from '../helpers';
import { BlockProperty } from '../blocks/BlockProperty';
import { IndexMisc } from '../blocks/IndexMisc';

type MiscVariablesProps = {
    readonly miscellaneous: {
        readonly variables: any[];
        readonly groupedVariables: Record<string, any[]>;
    };
    readonly depth?: number;
};

export const MiscellaneousVariables = (props: MiscVariablesProps): string => (
    <>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('miscellaneous')}</li>
            <li class="breadcrumb-item">{t('variables')}</li>
        </ol>
        {IndexMisc({ list: props.miscellaneous.variables })}
        {Object.entries(props.miscellaneous.groupedVariables).map(([key, properties]) => (<>
            <h3>{key}</h3>
            {BlockProperty({ properties, title: '', file: '', depth: props.depth })}
        </>))}
    </>
) as string;
