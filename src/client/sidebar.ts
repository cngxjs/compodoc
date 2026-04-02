/**
 * Sidebar collapse/expand behavior.
 * Shared state between desktop and mobile menus.
 * Default: all sections collapsed when no saved state exists.
 */

const STORAGE_KEY = 'compodoc-sidebar-state';
const ANIMATION_MS = 200;

/** Normalize element ID to a shared state key (strip xs- prefix) */
const stateKey = (id: string): string => id.replace(/^xs-/, '');

/** Get the sibling element ID (desktop <-> mobile) */
const siblingId = (id: string): string =>
    id.startsWith('xs-') ? id.slice(3) : 'xs-' + id;

const saveState = () => {
    try {
        const collapses = document.querySelectorAll<HTMLElement>('.menu .collapse[id]');
        const states: Record<string, boolean> = {};
        collapses.forEach(el => {
            states[stateKey(el.id)] = el.classList.contains('in');
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    } catch { /* localStorage blocked */ }
};

/** Apply saved state to all collapses. Without saved state, collapse all. */
const restoreState = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const states: Record<string, boolean> = saved ? JSON.parse(saved) : {};

        document.querySelectorAll<HTMLElement>('.menu .collapse[id]').forEach(el => {
            const key = stateKey(el.id);
            // Default to closed if no saved state
            const open = states[key] ?? false;
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

/** Apply open/closed state to an element without animation */
const applyState = (el: HTMLElement, open: boolean) => {
    if (open) {
        el.classList.add('in');
        el.style.display = 'block';
    } else {
        el.classList.remove('in');
        el.style.display = 'none';
    }
    // Sync chevron
    const toggler = document.querySelector(`[data-cdx-target="#${el.id}"]`);
    if (toggler) {
        const icon = toggler.querySelector('.ion-ios-arrow-up, .ion-ios-arrow-down');
        if (icon) {
            icon.classList.toggle('ion-ios-arrow-up', open);
            icon.classList.toggle('ion-ios-arrow-down', !open);
        }
    }
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

    // Toggle arrow icon on the clicked toggler
    const toggler = document.querySelector(`[data-cdx-target="${targetId}"]`);
    if (toggler) {
        const icon = toggler.querySelector('.ion-ios-arrow-up, .ion-ios-arrow-down');
        if (icon) {
            icon.classList.toggle('ion-ios-arrow-up');
            icon.classList.toggle('ion-ios-arrow-down');
        }
    }

    // Sync sibling (desktop <-> mobile) without animation
    const id = targetId.replace('#', '');
    const sibling = document.getElementById(siblingId(id));
    if (sibling) {
        applyState(sibling, !isOpen);
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
                e.preventDefault();
                toggleCollapse(target);
            } else if (link && toggler.classList.contains('linked')) {
                if (clickedEl.classList.contains('link-name')) {
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
        icon.classList.toggle('ion-ios-arrow-up', isOpen);
        icon.classList.toggle('ion-ios-arrow-down', !isOpen);
    });
};

/** Mobile hamburger menu toggle (data-cdx-mobile-toggle) */
const bindMobileMenu = () => {
    const menus: HTMLElement[] = [];

    document.querySelectorAll<HTMLElement>('[data-cdx-mobile-toggle]').forEach(btn => {
        const targetId = btn.getAttribute('data-cdx-mobile-toggle');
        if (!targetId) return;
        const menu = document.querySelector<HTMLElement>(targetId);
        if (!menu) return;
        menus.push(menu);

        btn.addEventListener('click', () => {
            const isOpen = menu.style.display === 'block';
            menu.style.display = isOpen ? 'none' : 'block';
        });

        menu.querySelectorAll('a[data-type]').forEach(link => {
            link.addEventListener('click', () => {
                menu.style.display = 'none';
            });
        });
    });

    // Close mobile menu when resizing to desktop
    const mq = window.matchMedia('(min-width: 768px)');
    mq.addEventListener('change', (e) => {
        if (e.matches) {
            menus.forEach(m => { m.style.display = 'none'; });
        }
    });
};

export const initSidebar = () => {
    bindTogglers();
    restoreState();
    syncChevrons();
    bindMobileMenu();
};

/** Re-bind togglers without restoring state (used after SPA navigation) */
export const rebindSidebar = () => {
    bindTogglers();
    syncChevrons();
};
