/**
 * Sidebar collapse/expand behavior.
 * Replaces bootstrap.native Collapse + menu.js logic.
 */

const STORAGE_KEY = 'compodoc-sidebar-state';
const ANIMATION_MS = 200;

const saveState = () => {
    try {
        const collapses = document.querySelectorAll<HTMLElement>('.menu .collapse[id]');
        const states: Record<string, boolean> = {};
        collapses.forEach(el => {
            states[el.id] = el.classList.contains('in');
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    } catch { /* localStorage blocked */ }
};

const restoreState = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const states: Record<string, boolean> = JSON.parse(saved);
        Object.entries(states).forEach(([id, open]) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (open) {
                el.classList.add('in');
                el.style.display = 'block';
            } else {
                el.classList.remove('in');
                el.style.display = 'none';
            }
        });
    } catch { /* localStorage blocked or invalid JSON */ }
};

const toggleCollapse = (targetId: string) => {
    const target = document.querySelector<HTMLElement>(targetId);
    if (!target) return;

    const isOpen = target.classList.contains('in');
    if (isOpen) {
        target.style.overflow = 'hidden';
        target.style.maxHeight = target.scrollHeight + 'px';
        requestAnimationFrame(() => {
            target.style.maxHeight = '0';
            target.style.transition = `max-height ${ANIMATION_MS}ms ease`;
        });
        setTimeout(() => {
            target.classList.remove('in');
            target.style.display = 'none';
            target.style.maxHeight = '';
            target.style.overflow = '';
            target.style.transition = '';
        }, ANIMATION_MS);
    } else {
        target.style.display = 'block';
        target.classList.add('in');
        target.style.overflow = 'hidden';
        target.style.maxHeight = '0';
        requestAnimationFrame(() => {
            target.style.maxHeight = target.scrollHeight + 'px';
            target.style.transition = `max-height ${ANIMATION_MS}ms ease`;
        });
        setTimeout(() => {
            target.style.maxHeight = '';
            target.style.overflow = '';
            target.style.transition = '';
        }, ANIMATION_MS);
    }

    // Toggle arrow icon
    const toggler = document.querySelector(`[data-cdx-target="${targetId}"]`);
    if (toggler) {
        const icon = toggler.querySelector('.ion-ios-arrow-up, .ion-ios-arrow-down');
        if (icon) {
            icon.classList.toggle('ion-ios-arrow-up');
            icon.classList.toggle('ion-ios-arrow-down');
        }
    }

    setTimeout(saveState, ANIMATION_MS + 50);
};

const bindTogglers = () => {
    document.querySelectorAll<HTMLElement>('[data-cdx-toggle="collapse"]').forEach(toggler => {
        toggler.addEventListener('click', (e) => {
            const target = toggler.getAttribute('data-cdx-target');
            if (!target) return;

            const clickedEl = e.target as HTMLElement;
            const link = toggler.closest('a');

            if (toggler.classList.contains('simple')) {
                // Pure toggler (no link) -- always prevent default
                e.preventDefault();
                toggleCollapse(target);
            } else if (link && toggler.classList.contains('linked')) {
                // Linked toggler -- only toggle collapse if clicking the
                // toggler div or arrow icon, not the link-name text
                if (clickedEl.classList.contains('link-name')) {
                    // Let the link navigate, don't toggle
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                toggleCollapse(target);
            } else {
                e.preventDefault();
                toggleCollapse(target);
            }
        });
    });
};

/** Sync chevron icons with actual collapse state */
const syncChevrons = () => {
    document.querySelectorAll<HTMLElement>('.menu .collapse[id]').forEach(el => {
        const isOpen = el.classList.contains('in');
        const toggler = document.querySelector(`[data-cdx-target="#${el.id}"]`);
        if (!toggler) return;
        const icon = toggler.querySelector('.ion-ios-arrow-up, .ion-ios-arrow-down');
        if (!icon) return;
        if (isOpen) {
            icon.classList.add('ion-ios-arrow-up');
            icon.classList.remove('ion-ios-arrow-down');
        } else {
            icon.classList.add('ion-ios-arrow-down');
            icon.classList.remove('ion-ios-arrow-up');
        }
    });
};

export const initSidebar = () => {
    bindTogglers();
    restoreState();
    syncChevrons();
};

/** Re-bind togglers without restoring state (used after SPA navigation) */
export const rebindSidebar = () => {
    bindTogglers();
    syncChevrons();
};
