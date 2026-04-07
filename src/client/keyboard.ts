/**
 * Keyboard-first navigation.
 * Shortcuts: ? (overlay), / (search), j/k (member nav), [/] (entity nav), Escape.
 */

import { openCommandPalette } from './command-palette';

const DIALOG_ID = 'cdx-shortcuts-dialog';
let currentMemberIndex = -1;

/** Check if shortcuts should be suppressed (input focus, open dialog) */
const isSuppressed = (): boolean => {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if ((el as HTMLElement).isContentEditable) return true;
    // Suppress when any dialog is open (command palette, shortcut overlay)
    if (document.querySelector('dialog[open]')) return true;
    return false;
};

/** Create the shortcuts overlay dialog (once) */
const createDialog = (): HTMLDialogElement => {
    const existing = document.getElementById(DIALOG_ID) as HTMLDialogElement;
    if (existing) return existing;

    const dialog = document.createElement('dialog');
    dialog.id = DIALOG_ID;
    dialog.className = 'cdx-shortcuts-dialog';
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Keyboard shortcuts');
    dialog.innerHTML = `
        <h2>Keyboard Shortcuts</h2>
        <div class="cdx-shortcuts-grid">
            <section>
                <h3>Navigation</h3>
                <dl>
                    <div class="cdx-shortcut-row"><dt><kbd>[</kbd></dt><dd>Previous entity</dd></div>
                    <div class="cdx-shortcut-row"><dt><kbd>]</kbd></dt><dd>Next entity</dd></div>
                </dl>
            </section>
            <section>
                <h3>Page</h3>
                <dl>
                    <div class="cdx-shortcut-row"><dt><kbd>j</kbd></dt><dd>Next member</dd></div>
                    <div class="cdx-shortcut-row"><dt><kbd>k</kbd></dt><dd>Previous member</dd></div>
                </dl>
            </section>
            <section>
                <h3>Search</h3>
                <dl>
                    <div class="cdx-shortcut-row"><dt><kbd>/</kbd></dt><dd>Open search</dd></div>
                    <div class="cdx-shortcut-row"><dt><kbd>?</kbd></dt><dd>This dialog</dd></div>
                </dl>
            </section>
        </div>
    `;
    document.body.appendChild(dialog);

    // Close on backdrop click
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
    });

    return dialog;
};

/** j/k member card navigation */
const navigateMember = (direction: 1 | -1) => {
    const cards = document.querySelectorAll<HTMLElement>('.cdx-tab-panel.active .cdx-member-card, .cdx-tab-panel:first-child .cdx-member-card');
    if (!cards.length) return;

    // Remove previous focus
    document.querySelectorAll('.cdx-member-card--focused').forEach(el =>
        el.classList.remove('cdx-member-card--focused')
    );

    currentMemberIndex += direction;
    if (currentMemberIndex < 0) currentMemberIndex = 0;
    if (currentMemberIndex >= cards.length) currentMemberIndex = cards.length - 1;

    const card = cards[currentMemberIndex];
    card.classList.add('cdx-member-card--focused');

    // Open collapsed details if present
    const details = card.querySelector('details:not([open])');
    if (details) (details as HTMLDetailsElement).open = true;

    // Scroll into view
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
};

/** [/] entity sidebar navigation */
const navigateEntity = (direction: 1 | -1) => {
    const links = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('.menu a[data-type="entity-link"]')
    );
    if (!links.length) return;

    const activeLink = document.querySelector<HTMLAnchorElement>('.menu a.active[data-type="entity-link"]');
    let currentIdx = activeLink ? links.indexOf(activeLink) : -1;

    let nextIdx = currentIdx + direction;
    // Wrap around
    if (nextIdx < 0) nextIdx = links.length - 1;
    if (nextIdx >= links.length) nextIdx = 0;

    const target = links[nextIdx];
    if (target) target.click(); // Triggers SPA router
};

/** Main keydown handler */
const onKeydown = (e: KeyboardEvent) => {
    // Always allow Escape to close the shortcut dialog
    if (e.key === 'Escape') {
        const dialog = document.getElementById(DIALOG_ID) as HTMLDialogElement;
        if (dialog?.open) {
            dialog.close();
            return;
        }
        // Clear member focus
        document.querySelectorAll('.cdx-member-card--focused').forEach(el =>
            el.classList.remove('cdx-member-card--focused')
        );
        currentMemberIndex = -1;
        return;
    }

    if (isSuppressed()) return;

    switch (e.key) {
        case '?':
            e.preventDefault();
            createDialog().showModal();
            break;
        case '/':
            e.preventDefault();
            openCommandPalette();
            break;
        case 'j':
            e.preventDefault();
            navigateMember(1);
            break;
        case 'k':
            e.preventDefault();
            navigateMember(-1);
            break;
        case '[':
            e.preventDefault();
            navigateEntity(-1);
            break;
        case ']':
            e.preventDefault();
            navigateEntity(1);
            break;
    }
};

/** Reset member navigation index (call on SPA navigation) */
export const resetKeyboardState = () => {
    currentMemberIndex = -1;
    document.querySelectorAll('.cdx-member-card--focused').forEach(el =>
        el.classList.remove('cdx-member-card--focused')
    );
};

export const initKeyboard = () => {
    document.addEventListener('keydown', onKeydown);
};
