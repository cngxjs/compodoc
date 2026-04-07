import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
    test('desktop: sections default expanded without saved state (toggleMenuItems: all)', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('compodoc-sidebar-state'));
        await page.reload();

        const sidebar = page.locator('#sidebar');
        const collapseSections = sidebar.locator('.collapse');
        const count = await collapseSections.count();
        expect(count).toBeGreaterThan(0);

        // Default toggleMenuItems is ['all'], so top-level sections start expanded
        const firstSection = collapseSections.first();
        await expect(firstSection).toHaveClass(/\bin\b/);
    });

    test('desktop: expand/collapse persists to localStorage', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('compodoc-sidebar-state'));
        await page.reload();

        const toggler = page.locator('#sidebar [data-cdx-toggle="collapse"]').first();
        await toggler.click();
        await page.waitForTimeout(300);

        const saved = await page.evaluate(() => localStorage.getItem('compodoc-sidebar-state'));
        expect(saved).toBeTruthy();
        const state = JSON.parse(saved!);
        const hasOpenEntry = Object.values(state).some(v => v === true);
        expect(hasOpenEntry).toBe(true);
    });
});

test.describe('Mobile menu', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('hamburger button toggles mobile sidebar', async ({ page }) => {
        await page.goto('/');

        const sidebar = page.locator('#sidebar');
        await expect(sidebar).not.toHaveClass(/cdx-sidebar--open/);

        await page.locator('[data-cdx-mobile-toggle]').click();
        await expect(sidebar).toHaveClass(/cdx-sidebar--open/);

        // Close via backdrop (force: true avoids intercepted pointer from sidebar overlay)
        await page.locator('.cdx-backdrop').click({ force: true });
        await page.waitForTimeout(300);
        await expect(sidebar).not.toHaveClass(/cdx-sidebar--open/);
    });

    test('mobile sidebar closes on navigation', async ({ page }) => {
        await page.goto('/');

        await page.locator('[data-cdx-mobile-toggle]').click();
        const sidebar = page.locator('#sidebar');
        await expect(sidebar).toHaveClass(/cdx-sidebar--open/);

        // Sections start expanded by default, so just click a visible link
        const link = sidebar.locator('a[data-type="entity-link"]').first();
        await link.scrollIntoViewIfNeeded();
        await link.click();
        await page.waitForTimeout(300);
        await expect(sidebar).not.toHaveClass(/cdx-sidebar--open/);
    });
});

test.describe('Mobile menu auto-close on resize', () => {
    test('closes when viewport exceeds 768px', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');

        await page.locator('[data-cdx-mobile-toggle]').click();
        const sidebar = page.locator('#sidebar');
        await expect(sidebar).toHaveClass(/cdx-sidebar--open/);

        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(200);
        await expect(sidebar).not.toHaveClass(/cdx-sidebar--open/);
    });
});

test.describe('Command palette', () => {
    test('opens with Cmd+K and closes with Escape', async ({ page }) => {
        await page.goto('/');

        const dialog = page.locator('#cdx-command-palette');
        await expect(dialog).not.toBeVisible();

        await page.keyboard.press('Meta+k');
        await expect(dialog).toBeVisible();

        const input = dialog.locator('.cdx-cp-input');
        await expect(input).toBeFocused();

        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
    });

    test('opens when sidebar search trigger is clicked', async ({ page }) => {
        await page.goto('/');

        // Click the search trigger button in sidebar header (use .cdx-search-trigger which is sidebar-only)
        await page.locator('.cdx-search-trigger').click();
        await page.waitForTimeout(200);

        const dialog = page.locator('#cdx-command-palette');
        await expect(dialog).toBeVisible();
    });

    test('closes on backdrop click', async ({ page }) => {
        await page.goto('/');

        await page.keyboard.press('Meta+k');
        const dialog = page.locator('#cdx-command-palette');
        await expect(dialog).toBeVisible();

        // Click the dialog backdrop area
        await dialog.click({ position: { x: 10, y: 10 } });
        await expect(dialog).not.toBeVisible();
    });
});

test.describe('Dark mode', () => {
    test('inline script applies dark class from localStorage', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.setItem('compodocx_darkmode-state', 'true'));
        await page.reload();

        const htmlHasDark = await page.evaluate(() =>
            document.documentElement.classList.contains('dark')
        );
        expect(htmlHasDark).toBe(true);
    });

    test('toggle switches dark mode off and on', async ({ page }) => {
        await page.goto('/');

        // Click the sidebar .cdx-dark-toggle button (topbar one is hidden at desktop)
        await page.locator('#sidebar .cdx-dark-toggle').click();
        await page.waitForTimeout(100);

        const noDark = await page.evaluate(() =>
            !document.documentElement.classList.contains('dark') &&
            !document.body.classList.contains('dark')
        );
        expect(noDark).toBe(true);

        // Click again to toggle dark mode back on
        await page.locator('#sidebar .cdx-dark-toggle').click();
        await page.waitForTimeout(100);

        const hasDark = await page.evaluate(() =>
            document.documentElement.classList.contains('dark') &&
            document.body.classList.contains('dark')
        );
        expect(hasDark).toBe(true);
    });
});

test.describe('SPA navigation', () => {
    test('sidebar link swaps content without full page reload', async ({ page }) => {
        await page.goto('/');
        const initialUrl = page.url();

        // Expand a section
        const toggler = page.locator('#sidebar [data-cdx-toggle="collapse"]').first();
        await toggler.click();
        await page.waitForTimeout(300);

        const entityLink = page.locator('#sidebar a[data-type="entity-link"]').first();
        if (await entityLink.count() > 0) {
            // Mark the sidebar DOM to verify it wasn't replaced
            await page.evaluate(() => {
                document.querySelector('#sidebar')?.setAttribute('data-spa-marker', '1');
            });

            await entityLink.click();
            await page.waitForTimeout(500);

            // URL changed
            expect(page.url()).not.toBe(initialUrl);

            // Sidebar DOM was preserved (not replaced)
            const marker = await page.evaluate(() =>
                document.querySelector('#sidebar')?.getAttribute('data-spa-marker')
            );
            expect(marker).toBe('1');
        }
    });

    test('content scripts execute after SPA navigation', async ({ page }) => {
        await page.goto('/');

        const routesLink = page.locator('#sidebar a[href="routes.html"]');
        if (await routesLink.count() > 0) {
            await routesLink.click();
            await page.waitForTimeout(2000);

            const hasRoutesIndex = await page.evaluate(() =>
                typeof (window as any).ROUTES_INDEX !== 'undefined'
            );
            expect(hasRoutesIndex).toBe(true);

            const svg = page.locator('#body-routes svg');
            await expect(svg).toBeVisible();
        }
    });
});

test.describe('Module graph', () => {
    test('SVG pan-zoom: zoom buttons work', async ({ page }) => {
        await page.goto('/modules.html');

        const browseBtn = page.locator('a.cdx-btn:has-text("Browse")').first();
        await browseBtn.click();
        await page.waitForTimeout(1000);

        const svg = page.locator('#module-graph-svg svg');
        if (await svg.count() > 0) {
            await expect(svg).toBeVisible();

            const zoomIn = page.locator('#zoom-in');
            if (await zoomIn.count() > 0) {
                await zoomIn.click();
                await page.waitForTimeout(400);
                await expect(svg).toBeVisible();
            }
        }
    });
});

test.describe('Lazy graph loading', () => {
    test('modules page loads SVG graphs via IntersectionObserver', async ({ page }) => {
        await page.goto('/modules.html');
        await page.waitForTimeout(1000);

        const loadedObjects = page.locator('object[type="image/svg+xml"][data]');
        const count = await loadedObjects.count();
        expect(count).toBeGreaterThan(0);
    });
});
