import Html from '@kitajs/html';
import { capitalize, parseProperty, t } from '../helpers';

type PackagePropertiesProps = {
    readonly packageProperties?: Record<string, unknown>;
};

export const PackageProperties = (props: PackagePropertiesProps): string => {
    if (!props.packageProperties) {
        return '';
    }
    return (
        <div class="cdx-prose">
            <section class="cdx-content-section">
                <h2 class="cdx-section-heading">{t('properties')}</h2>
                <dl class="cdx-metadata-card">
                    {Object.entries(props.packageProperties).map(([key, value]) => (
                        <div class="cdx-metadata-row">
                            <dt class="cdx-metadata-label">{capitalize(key)}</dt>
                            <dd class="cdx-metadata-value">{parseProperty(value)}</dd>
                        </div>
                    ))}
                </dl>
            </section>
        </div>
    ) as string;
};
