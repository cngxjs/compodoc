import Configuration from '../../app/configuration';

type Tab = { readonly id: string; [key: string]: unknown };

/** Check if a tab is present in the navTabs array. */
export const isTabEnabled = (tabs: Tab[] | undefined, tabId: string): boolean =>
    Array.isArray(tabs) && tabs.findIndex(tab => tab.id === tabId) !== -1;

/** Check if a tab is the first (initially active) tab. */
export const isInitialTab = (tabs: Tab[] | undefined, tabId: string): boolean =>
    Array.isArray(tabs) && tabs.length > 0 && tabs[0].id === tabId;

/** Check if an info section should be displayed. Empty config = show all. */
export const isInfoSection = (sectionId: string): boolean => {
    const sections = Configuration.mainData.infoTabSections;
    if (!sections || sections.length === 0) {
        return true;
    }
    return sections.includes(sectionId);
};
