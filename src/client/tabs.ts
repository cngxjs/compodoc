/**
 * Tab switching behavior.
 * Uses cdx-tabs tab bar and cdx-tab-panel panels.
 * Implements WAI-ARIA Tabs pattern: roving tabindex, arrow/Home/End keys,
 * aria-selected, and sliding underline indicator.
 */

/** Position the sliding underline indicator under the active tab */
const positionUnderline = (tabList: HTMLElement) => {
    const activeTab = tabList.querySelector<HTMLElement>('[role="tab"].active');
    let underline = tabList.querySelector<HTMLElement>('.cdx-tabs-underline');

    if (!activeTab) {
        if (underline) underline.style.opacity = '0';
        return;
    }

    if (!underline) {
        underline = document.createElement('span');
        underline.className = 'cdx-tabs-underline';
        underline.setAttribute('aria-hidden', 'true');
        tabList.appendChild(underline);
    }

    const tabListRect = tabList.getBoundingClientRect();
    const activeRect = activeTab.getBoundingClientRect();
    underline.style.width = `${activeRect.width}px`;
    underline.style.transform = `translateX(${activeRect.left - tabListRect.left + tabList.scrollLeft}px)`;
    underline.style.opacity = '1';
};

/** Activate a specific tab and its panel */
const activateTab = (tab: HTMLElement, tabList: HTMLElement) => {
    // Deactivate all tabs in this group
    tabList.querySelectorAll<HTMLElement>('[role="tab"]').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
    });

    // Deactivate all panels
    const targetId = tab.dataset.cdxTarget || tab.getAttribute('href');
    if (targetId) {
        const targetPane = document.querySelector(targetId);
        const tabContent = targetPane?.parentElement;
        if (tabContent) {
            tabContent.querySelectorAll<HTMLElement>('.cdx-tab-panel').forEach(pane => {
                pane.classList.remove('active');
            });
        }
        targetPane?.classList.add('active');
    }

    // Activate selected tab
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    tab.focus();

    // Update underline position
    positionUnderline(tabList);
};

export const initTabs = () => {
    document.querySelectorAll<HTMLElement>('.cdx-tabs, [role="tablist"]').forEach(tabList => {
        const tabs = Array.from(tabList.querySelectorAll<HTMLElement>('[role="tab"]'));
        if (!tabs.length) return;

        // Click handler
        tabs.forEach(tab => {
            tab.addEventListener('click', e => {
                e.preventDefault();
                activateTab(tab, tabList);
            });
        });

        // Keyboard navigation
        tabList.addEventListener('keydown', e => {
            const current = document.activeElement as HTMLElement;
            if (!current?.matches('[role="tab"]')) return;

            const idx = tabs.indexOf(current);
            if (idx === -1) return;

            let next: number | null = null;

            switch (e.key) {
                case 'ArrowRight':
                    next = (idx + 1) % tabs.length;
                    break;
                case 'ArrowLeft':
                    next = (idx - 1 + tabs.length) % tabs.length;
                    break;
                case 'Home':
                    next = 0;
                    break;
                case 'End':
                    next = tabs.length - 1;
                    break;
                default:
                    return;
            }

            e.preventDefault();
            activateTab(tabs[next], tabList);
        });

        // Initial underline position
        positionUnderline(tabList);
    });
};
