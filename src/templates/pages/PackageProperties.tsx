import Html from '@kitajs/html';
import { capitalize, parseProperty, t } from '../helpers';

type PackagePropertiesProps = {
    readonly packageProperties?: Record<string, unknown>;
};

export const PackageProperties = (props: PackagePropertiesProps): string => {
    if (!props.packageProperties) return '';
    return (<>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('properties')}</li>
        </ol>
        <ul class="properties-list">
            {Object.entries(props.packageProperties).map(([key, value]) => (
                <li><b>{capitalize(key)}</b> : {parseProperty(value)}</li>
            ))}
        </ul>
    </>) as string;
};
