import Html from '@kitajs/html';
import { t } from '../helpers';

type PackageDependenciesProps = {
    readonly packageDependencies?: Record<string, string>;
    readonly packagePeerDependencies?: Record<string, string>;
};

const DependencyList = (props: { deps: Record<string, string> }): string => (
    <ul class="dependencies-list">
        {Object.entries(props.deps).map(([key, value]) => (
            <li><b>{key}</b> : {value}</li>
        ))}
    </ul>
) as string;

export const PackageDependencies = (props: PackageDependenciesProps): string => (
    <>
        {props.packageDependencies && (
            <>
                <ol class="breadcrumb">
                    <li class="breadcrumb-item">{t('dependencies')}</li>
                </ol>
                <DependencyList deps={props.packageDependencies} />
            </>
        )}
        {props.packagePeerDependencies && (
            <>
                {props.packageDependencies && <br />}
                <ol class="breadcrumb">
                    <li class="breadcrumb-item">{t('peer-dependencies')}</li>
                </ol>
                <DependencyList deps={props.packagePeerDependencies} />
            </>
        )}
    </>
) as string;
