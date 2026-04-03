/**
 * Tab switching behavior.
 * Uses cdx-tabs tab bar and cdx-tab-panel panels.
 */

export const initTabs = () => {
    document.querySelectorAll<HTMLElement>('[data-cdx-toggle="tab"]').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = tab.getAttribute('data-cdx-target') || tab.getAttribute('href');
            if (!targetId) return;

            // Deactivate all tabs in this group
            const tabList = tab.closest('.cdx-tabs, [role="tablist"]');
            if (tabList) {
                tabList.querySelectorAll('[data-cdx-toggle="tab"]').forEach(t => {
                    t.classList.remove('active');
                });
            }

            // Deactivate all panels in this content area
            const targetPane = document.querySelector(targetId);
            const tabContent = targetPane?.parentElement;
            if (tabContent) {
                tabContent.querySelectorAll('.cdx-tab-panel').forEach(pane => {
                    pane.classList.remove('active');
                });
            }

            // Activate selected tab and panel
            tab.classList.add('active');
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });
};
