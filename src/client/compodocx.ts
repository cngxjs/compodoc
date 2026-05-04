import { initAnimations } from './animate';
import { initCodeBlocks } from './code-blocks';
import { initCommandPalette } from './command-palette';
import { initCoverage } from './coverage';
import { initGraphs } from './graphs';
import { initHashRouter } from './hash-router';
import { initKeyboard } from './keyboard';
import { initRouter } from './router';
import { initSidebar } from './sidebar';
import { initStackblitz } from './stackblitz';
import { initTabs } from './tabs';
import { initTheme } from './theme';

// import { initToc } from './toc';

// Theme must run before DOMContentLoaded to prevent flash
initTheme();

const init = () => {
    initSidebar();
    initTabs();
    initCodeBlocks();
    initHashRouter();
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
