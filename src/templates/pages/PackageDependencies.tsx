import Html from '@kitajs/html';
import { t } from '../helpers';

type PackageDependenciesProps = {
    readonly packageDependencies?: Record<string, string>;
    readonly packagePeerDependencies?: Record<string, string>;
};

const DependencyCard = (props: { deps: Record<string, string> }): string =>
    (
        <dl class="cdx-metadata-card">
            {Object.entries(props.deps).map(([name, version]) => (
                <div class="cdx-metadata-row">
                    <dt class="cdx-metadata-label">
                        <code>{name}</code>
                    </dt>
                    <dd class="cdx-metadata-value">{version}</dd>
                </div>
            ))}
        </dl>
    ) as string;

export const PackageDependencies = (props: PackageDependenciesProps): string =>
    (
        <div class="cdx-prose">
            {props.packageDependencies && (
                <section class="cdx-content-section">
                    <h2 class="cdx-section-heading">{t('dependencies')}</h2>
                    <DependencyCard deps={props.packageDependencies} />
                </section>
            )}
            {props.packagePeerDependencies &&
                Object.keys(props.packagePeerDependencies).length > 0 && (
                    <section class="cdx-content-section">
                        <h2 class="cdx-section-heading">{t('peer-dependencies')}</h2>
                        <DependencyCard deps={props.packagePeerDependencies} />
                    </section>
                )}
        </div>
    ) as string;
