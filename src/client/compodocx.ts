import { initSidebar } from './sidebar';
import { initTabs } from './tabs';
import { initCodeBlocks } from './code-blocks';
import { initTheme } from './theme';
import { initRouter } from './router';
import { initCommandPalette } from './command-palette';
import { initGraphs } from './graphs';
import { initStackblitz } from './stackblitz';
// import { initToc } from './toc';

// Theme must run before DOMContentLoaded to prevent flash
initTheme();

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initTabs();
    initCodeBlocks();
    initRouter();
    initCommandPalette();
    initGraphs();
    initStackblitz();
    // initToc(); // TODO: enable when ToC styling is finalized
});
