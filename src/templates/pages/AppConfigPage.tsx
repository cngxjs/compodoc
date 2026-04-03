import Html from '@kitajs/html';
import { t } from '../helpers';
import { iconFor, IconSettings } from '../components/Icons';

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
    if (name.includes('Router')) return 'ion-ios-git-branch';
    if (name.includes('Http')) return 'ion-ios-cloud';
    if (name.includes('Animation')) return 'ion-ios-film';
    if (name.includes('Zoneless')) return 'ion-ios-flash';
    if (name.includes('Store') || name.includes('State')) return 'ion-ios-filing';
    return 'ion-ios-settings';
};

const ProviderCard = (provider: ProviderCall): string => (
    <div class="cdx-provider-card">
        <div class="cdx-provider-header">
            {iconFor(providerIcon(provider.name))}
            <code class="cdx-provider-name">{provider.name}()</code>
        </div>
        {provider.features.length > 0 && (
            <div class="cdx-provider-features">
                <span class="cdx-provider-features-label">Features:</span>
                {provider.features.map(f => (
                    <span class="cdx-badge cdx-badge--factory">{f}()</span>
                ))}
            </div>
        )}
    </div>
) as string;

export const AppConfigPage = (data: any): string => {
    const configs: AppConfigData[] = data.appConfig || [];
    if (configs.length === 0) return '';

    return (<>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">Application Configuration</li>
        </ol>

        {configs.map(config => (<>
            <div class="cdx-app-config">
                {config.description && (
                    <p class="cdx-app-config-desc">{config.description}</p>
                )}

                <div class="cdx-app-config-meta">
                    <span class="cdx-badge cdx-badge--standalone">{config.name}</span>
                    {config.since && <span class="cdx-badge cdx-badge--since">v{config.since}</span>}
                    <code class="cdx-app-config-file">{config.file}</code>
                </div>

                {config.providers.length > 0 ? (<>
                    <h3>Providers ({config.providers.length})</h3>
                    <div class="cdx-providers-grid">
                        {config.providers.map(p => ProviderCard(p))}
                    </div>
                </>) : (
                    <p>No providers configured.</p>
                )}
            </div>
        </>))}
    </>) as string;
};
