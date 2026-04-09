import Html from '@kitajs/html';
import { extractReadmeHeadings, isInitialTab, isReadmeEmpty, isTabEnabled, t } from '../helpers';
import { highlightCode } from '../../app/engines/syntax-highlight.engine';
import { shortPath } from '../helpers/short-url';
import { EmptyState } from '../components/EmptyState';
import { EmptyIconBook, EmptyIconFile } from '../components/EmptyStateIcons';

type Tab = {
    readonly id: string;
    readonly href: string;
    readonly label: string;
    readonly 'data-link'?: string;
};

type EntityTabsProps = {
    readonly navTabs: Tab[];
    readonly infoContent: string;
    readonly readme?: string;
    readonly sourceCode?: string;
    readonly filePath?: string;
    readonly exampleUrls?: string[];
};

/** Render the tab bar + tab panels for entity detail pages. */
export const EntityTabs = (props: EntityTabsProps): string => (<>
    <ul class="cdx-tab-bar" role="tablist">
        {props.navTabs.map((tab, i) => (
            <li role="presentation">
                <a href={tab.href}
                    class={i === 0 ? 'active' : ''}
                    role="tab" id={`${tab.id}-tab`}
                    aria-selected={i === 0 ? 'true' : 'false'}
                    aria-controls={tab.id}
                    tabindex={i === 0 ? '0' : '-1'}
                    data-cdx-toggle="tab"
                    data-link={tab['data-link']}>{t(tab.label)}</a>
            </li>
        ))}
    </ul>

    <div>
        {isTabEnabled(props.navTabs, 'info') && (
            <div class={`cdx-tab-panel${isInitialTab(props.navTabs, 'info') ? ' active' : ''}`}
                id="info" role="tabpanel" aria-labelledby="info-tab">
                {props.infoContent}
            </div>
        )}

        {isTabEnabled(props.navTabs, 'readme') && (
            <div class={`cdx-tab-panel${isInitialTab(props.navTabs, 'readme') ? ' active' : ''}`}
                id="readme" role="tabpanel" aria-labelledby="readme-tab">
                {isReadmeEmpty(props.readme)
                    ? <>{extractReadmeHeadings(props.readme)}{EmptyState({ icon: EmptyIconBook(), title: t('empty-readme-title'), description: t('empty-readme-desc'), variant: 'full' })}</>
                    : <p>{props.readme}</p>
                }
            </div>
        )}

        {isTabEnabled(props.navTabs, 'source') && (
            <div class={`cdx-tab-panel${isInitialTab(props.navTabs, 'source') ? ' active' : ''} tab-source-code`}
                id="source" role="tabpanel" aria-labelledby="source-tab">
                {props.sourceCode
                    ? <div class="cdx-source-code">
                        {props.filePath && <div class="cdx-source-header"><span>{shortPath(props.filePath)}</span></div>}
                        {highlightCode(props.sourceCode, { lang: 'typescript', mode: 'source' })}
                      </div>
                    : EmptyState({ icon: EmptyIconFile(), title: t('empty-source-title'), description: t('empty-source-desc'), variant: 'full' })
                }
            </div>
        )}

        {isTabEnabled(props.navTabs, 'example') && props.exampleUrls && (
            <div class={`cdx-tab-panel${isInitialTab(props.navTabs, 'example') ? ' active' : ''}`}
                id="example" role="tabpanel" aria-labelledby="example-tab">
                {props.exampleUrls.map(url => (
                    <iframe class="cdx-example-container" src={url}>
                        <p>{t('no-iframes')}</p>
                    </iframe>
                ))}
            </div>
        )}
    </div>
</>) as string;
