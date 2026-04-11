import Configuration from '../../app/configuration';
import { DEFAULT_API_SECTIONS, DEFAULT_INFO_SECTIONS } from '../../utils/constants';

type Tab = { readonly id: string; [key: string]: unknown };

/** Check if a tab is present in the navTabs array. */
export const isTabEnabled = (tabs: Tab[] | undefined, tabId: string): boolean =>
    Array.isArray(tabs) && tabs.findIndex(tab => tab.id === tabId) !== -1;

/** Check if a tab is the first (initially active) tab. */
export const isInitialTab = (tabs: Tab[] | undefined, tabId: string): boolean =>
    Array.isArray(tabs) && tabs.length > 0 && tabs[0].id === tabId;

const hasExplicit = (sections: string[] | undefined): boolean =>
    Array.isArray(sections) && sections.length > 0;

/**
 * Resolution matrix for the Info/API tab split.
 *
 * | infoTabSections | apiTabSections | info tab         | api tab         |
 * |-----------------|----------------|------------------|-----------------|
 * | empty           | empty          | DEFAULT_INFO     | DEFAULT_API     | ← new default
 * | set             | empty          | user list        | **dropped**     | ← legacy single-tab
 * | empty           | set            | DEFAULT_INFO     | user list       |
 * | set             | set            | user list        | user list       | ← full control
 *
 * The "legacy single-tab" row preserves backwards compatibility: projects that
 * configured `infoTabSections` against the pre-split version of compodocx
 * continue to see exactly what they had (everything they listed, on Info) and
 * the API tab is filtered out of `getNavTabs()` so nothing duplicates.
 */
const hasInfoExplicit = (): boolean => hasExplicit(Configuration.mainData.infoTabSections);
const hasApiExplicit = (): boolean => hasExplicit(Configuration.mainData.apiTabSections);
const isLegacyOnlyInfo = (): boolean => hasInfoExplicit() && !hasApiExplicit();

/** Check if a section belongs to the **Info** tab. */
export const isInfoSection = (sectionId: string): boolean => {
    const info = Configuration.mainData.infoTabSections;
    if (hasExplicit(info)) {
        return info.includes(sectionId);
    }
    return DEFAULT_INFO_SECTIONS.includes(sectionId);
};

/** Check if a section belongs to the **API** tab. */
export const isApiSection = (sectionId: string): boolean => {
    if (isLegacyOnlyInfo()) {
        return false;
    }
    const api = Configuration.mainData.apiTabSections;
    if (hasExplicit(api)) {
        return api.includes(sectionId);
    }
    return DEFAULT_API_SECTIONS.includes(sectionId);
};

/**
 * True when the API tab should be materialised at all.
 * False in legacy single-tab mode (only `infoTabSections` configured).
 */
export const hasAnyApiSections = (): boolean => !isLegacyOnlyInfo();
