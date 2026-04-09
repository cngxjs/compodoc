import Html from '@kitajs/html';
import { IconFile, IconSettings, iconFor } from '../components/Icons';
import { resolveType } from '../helpers/link-type';
import { parseDescription, t } from '../helpers';

type ProviderCall = {
    readonly name: string;
    readonly features: string[];
};

type AppConfigData = {
    readonly name: string;
    readonly file: string;
    readonly description?: string;
    readonly providers: ProviderCall[];
    readonly since?: string;
};

const providerIcon = (name: string): string => {
    if (name.includes('Router')) {
        return 'ion-ios-git-branch';
    }
    if (name.includes('Http')) {
        return 'ion-ios-cloud';
    }
    if (name.includes('Animation')) {
        return 'ion-ios-film';
    }
    if (name.includes('Zoneless') || name.includes('Zone')) {
        return 'ion-ios-flash';
    }
    if (name.includes('Store') || name.includes('State')) {
        return 'ion-ios-filing';
    }
    return 'ion-ios-settings';
};

/** Link a function name to Angular API docs or internal docs via DependenciesEngine. */
const linkedName = (name: string): string => {
    const resolved = resolveType(name);
    if (resolved) {
        return `<a href="${resolved.href}" target="${resolved.target}">${name}()</a>`;
    }
    return `${name}()`;
};

const ProviderCard = (provider: ProviderCall): string =>
    (
        <div class="cdx-provider-card">
            <div class="cdx-provider-header">
                {iconFor(providerIcon(provider.name))}
                <code class="cdx-provider-name">{linkedName(provider.name)}</code>
            </div>
            {provider.features.length > 0 && (
                <div class="cdx-provider-features">
                    <span class="cdx-provider-features-label">Features:</span>
                    {provider.features.map(f => (
                        <code class="cdx-provider-feature">{linkedName(f)}</code>
                    ))}
                </div>
            )}
        </div>
    ) as string;

export const AppConfigPage = (data: any): string => {
    const configs: AppConfigData[] = data.appConfig || [];
    if (configs.length === 0) {
        return '';
    }

    return (
        <>
            {configs.map(config => (
                <>
                    <div class="cdx-entity-hero" style="--cdx-hero-color: var(--color-cdx-entity-service)">
                        <div class="cdx-entity-hero-watermark" aria-hidden="true">
                            {IconSettings()}
                        </div>
                        <nav aria-label="Breadcrumb">
                            <ol class="cdx-breadcrumb">
                                <li>{t('application-configuration')}</li>
                                <li aria-current="page">{config.name}</li>
                            </ol>
                        </nav>
                        <h1 class="cdx-entity-hero-name">{config.name}</h1>
                        <div class="cdx-entity-hero-badges">
                            <span class="cdx-badge cdx-badge--entity-injectable">Config</span>
                            {config.since && (
                                <span class="cdx-badge cdx-badge--since">v{config.since}</span>
                            )}
                            <span class="cdx-badge cdx-badge--outline">
                                {config.providers.length} {config.providers.length === 1 ? 'provider' : 'providers'}
                            </span>
                        </div>
                        <p class="cdx-entity-hero-file" title="Source file">
                            {IconFile()}
                            <span>{config.file}</span>
                        </p>
                    </div>

                    {/* Description */}
                    {config.description && (
                        <section class="cdx-content-section">
                            <h3 class="cdx-section-heading">{t('description')}</h3>
                            <div class="cdx-prose">{parseDescription(config.description, data.depth ?? 0)}</div>
                        </section>
                    )}

                    {/* Providers */}
                    <section class="cdx-content-section">
                        <h3 class="cdx-section-heading" id="providers">
                            Providers ({config.providers.length})
                        </h3>
                        {config.providers.length > 0 ? (
                            <div class="cdx-providers-grid">
                                {config.providers.map(p => ProviderCard(p))}
                            </div>
                        ) : (
                            <p>No providers configured.</p>
                        )}
                    </section>
                </>
            ))}
        </>
    ) as string;
};
