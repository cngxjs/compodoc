import { initSidebar } from './sidebar';
import { initTabs } from './tabs';
import { initCodeBlocks } from './code-blocks';
import { initTheme } from './theme';

// Theme must run before DOMContentLoaded to prevent flash
initTheme();

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initTabs();
    initCodeBlocks();
});
