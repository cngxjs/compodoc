/**
 * Tab switching behavior.
 * Uses cdx-tab-bar pill bar and cdx-tab-panel panels.
 * Implements WAI-ARIA Tabs pattern: roving tabindex, arrow/Home/End keys,
 * aria-selected, active pill highlighting.
 */

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
};

export const initTabs = () => {
    document.querySelectorAll<HTMLElement>('.cdx-tab-bar, [role="tablist"]').forEach(tabList => {
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
    });
};
