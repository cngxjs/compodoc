import Html from '@kitajs/html';
import { isInitialTab, isTabEnabled, t } from '../helpers';
import { highlightCode } from '../../app/engines/syntax-highlight.engine';

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
    readonly exampleUrls?: string[];
};

/** Render the shared nav-tabs + tab-content structure for entity detail pages. */
export const EntityTabs = (props: EntityTabsProps): string => (<>
    <ul class="nav nav-tabs" role="tablist">
        {props.navTabs.map((tab, i) => (
            <li class="nav-item">
                <a href={tab.href}
                    class={i === 0 ? 'nav-link active' : 'nav-link'}
                    role="tab" id={`${tab.id}-tab`}
                    data-cdx-toggle="tab"
                    data-link={tab['data-link']}>{t(tab.label)}</a>
            </li>
        ))}
    </ul>

    <div class="tab-content">
        {isTabEnabled(props.navTabs, 'info') && (
            <div class={`tab-pane fade${isInitialTab(props.navTabs, 'info') ? ' active in' : ''}`} id="info">
                {props.infoContent}
            </div>
        )}

        {isTabEnabled(props.navTabs, 'readme') && (
            <div class={`tab-pane fade${isInitialTab(props.navTabs, 'readme') ? ' active in' : ''}`} id="readme">
                <p>{props.readme}</p>
            </div>
        )}

        {isTabEnabled(props.navTabs, 'source') && (
            <div class={`tab-pane fade${isInitialTab(props.navTabs, 'source') ? ' active in' : ''} tab-source-code`} id="source">
                <div class="compodoc-sourcecode">{highlightCode(props.sourceCode ?? '', 'typescript')}</div>
            </div>
        )}

        {isTabEnabled(props.navTabs, 'example') && props.exampleUrls && (
            <div class={`tab-pane fade${isInitialTab(props.navTabs, 'example') ? ' active in' : ''}`} id="example">
                {props.exampleUrls.map(url => (
                    <iframe class="exampleContainer" src={url}>
                        <p>{t('no-iframes')}</p>
                    </iframe>
                ))}
            </div>
        )}
    </div>
</>) as string;
