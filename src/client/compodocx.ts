import { initSidebar } from './sidebar';
import { initTabs } from './tabs';
import { initCodeBlocks } from './code-blocks';
import { initTheme } from './theme';
import { initRouter } from './router';
import { initCommandPalette } from './command-palette';
import { initGraphs } from './graphs';
import { initStackblitz } from './stackblitz';
import { initCoverage } from './coverage';
import { initKeyboard } from './keyboard';
import { initAnimations } from './animate';
// import { initToc } from './toc';

// Theme must run before DOMContentLoaded to prevent flash
initTheme();

const init = () => {
    initSidebar();
    initTabs();
    initCodeBlocks();
    initRouter();
    initCommandPalette();
    initGraphs();
    initStackblitz();
    initCoverage();
    initKeyboard();
    initAnimations();
    // initToc(); // TODO: enable when ToC styling is finalized
};

// ESM modules are deferred — DOMContentLoaded may have already fired
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
