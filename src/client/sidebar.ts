/**
 * Sidebar collapse/expand behavior.
 * Single sidebar DOM serves both desktop and mobile.
 * Default: all sections collapsed when no saved state exists.
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

/** Apply saved state to all collapses. Without saved state, collapse all. */
const restoreState = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const states: Record<string, boolean> = saved ? JSON.parse(saved) : {};

        document.querySelectorAll<HTMLElement>('.menu .collapse[id]').forEach(el => {
            const open = states[el.id] ?? false;
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
            target.style.transition = `max-height ${ANIMATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
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
            target.style.transition = `max-height ${ANIMATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
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

/* ----------------------------------------------------------------
   Mobile sidebar slide-over
   ---------------------------------------------------------------- */

let sidebarEl: HTMLElement | null = null;
let backdropEl: HTMLElement | null = null;
let toggleBtn: HTMLElement | null = null;

const isMobileSidebarOpen = (): boolean =>
    sidebarEl?.classList.contains('cdx-sidebar--open') ?? false;

const openMobileSidebar = () => {
    if (!sidebarEl || !backdropEl) return;
    sidebarEl.classList.add('cdx-sidebar--open');
    backdropEl.style.display = 'block';
    requestAnimationFrame(() => backdropEl!.classList.add('cdx-backdrop--visible'));
    document.body.style.overflow = 'hidden';
    toggleBtn?.setAttribute('aria-expanded', 'true');

    // Focus the first focusable element in sidebar
    const firstFocusable = sidebarEl.querySelector<HTMLElement>('a, button, input');
    firstFocusable?.focus();
};

const closeMobileSidebar = () => {
    if (!sidebarEl || !backdropEl) return;
    sidebarEl.classList.remove('cdx-sidebar--open');
    backdropEl.classList.remove('cdx-backdrop--visible');
    document.body.style.overflow = '';
    toggleBtn?.setAttribute('aria-expanded', 'false');

    setTimeout(() => {
        if (!isMobileSidebarOpen()) {
            backdropEl!.style.display = 'none';
        }
    }, ANIMATION_MS);

    // Return focus to hamburger
    toggleBtn?.focus();
};

const bindMobileMenu = () => {
    sidebarEl = document.getElementById('sidebar');
    backdropEl = document.querySelector('.cdx-backdrop');

    document.querySelectorAll<HTMLElement>('[data-cdx-mobile-toggle]').forEach(btn => {
        toggleBtn = btn;
        btn.addEventListener('click', () => {
            if (isMobileSidebarOpen()) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    });

    // Backdrop click closes sidebar
    backdropEl?.addEventListener('click', closeMobileSidebar);

    // Escape key closes sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMobileSidebarOpen()) {
            closeMobileSidebar();
        }
    });

    // Close sidebar links (navigate)
    sidebarEl?.querySelectorAll('a[data-type]').forEach(link => {
        link.addEventListener('click', () => {
            if (isMobileSidebarOpen()) {
                closeMobileSidebar();
            }
        });
    });

    // Close mobile sidebar on resize to desktop
    const mq = window.matchMedia('(min-width: 768px)');
    mq.addEventListener('change', (e) => {
        if (e.matches && isMobileSidebarOpen()) {
            closeMobileSidebar();
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
