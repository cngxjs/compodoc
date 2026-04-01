/**
 * Tab switching behavior.
 * Replaces tabs.js + bootstrap.native tab logic.
 */

export const initTabs = () => {
    document.querySelectorAll<HTMLElement>('[data-cdx-toggle="tab"]').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = tab.getAttribute('data-cdx-target') || tab.getAttribute('href');
            if (!targetId) return;

            // Deactivate all tabs in this group
            const tabList = tab.closest('.nav-tabs, .nav, [role="tablist"]');
            if (tabList) {
                tabList.querySelectorAll('[data-cdx-toggle="tab"]').forEach(t => {
                    t.classList.remove('active');
                    t.parentElement?.classList.remove('active');
                });
            }

            // Deactivate all panes in this content area
            const tabContent = document.querySelector(targetId)?.parentElement;
            if (tabContent) {
                tabContent.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active', 'in');
                });
            }

            // Activate selected tab and pane
            tab.classList.add('active');
            tab.parentElement?.classList.add('active');
            const pane = document.querySelector<HTMLElement>(targetId);
            if (pane) {
                pane.classList.add('active', 'in');
            }
        });
    });
};
