import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
    test('desktop: sections default collapsed without saved state', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('compodoc-sidebar-state'));
        await page.reload();

        const desktopMenu = page.locator('.d-none.d-md-block.menu');
        const collapseSections = desktopMenu.locator('.collapse');
        const count = await collapseSections.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const section = collapseSections.nth(i);
            await expect(section).not.toHaveClass(/\bin\b/);
        }
    });

    test('desktop: expand/collapse persists to localStorage', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('compodoc-sidebar-state'));
        await page.reload();

        const toggler = page.locator('.d-none.d-md-block.menu [data-cdx-toggle="collapse"]').first();
        await toggler.click();
        await page.waitForTimeout(300);

        const saved = await page.evaluate(() => localStorage.getItem('compodoc-sidebar-state'));
        expect(saved).toBeTruthy();
        const state = JSON.parse(saved!);
        const hasOpenEntry = Object.values(state).some(v => v === true);
        expect(hasOpenEntry).toBe(true);
    });

    test('desktop/mobile: collapse state syncs between menus', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => localStorage.removeItem('compodoc-sidebar-state'));
        await page.reload();

        const toggler = page.locator('.d-none.d-md-block.menu [data-cdx-toggle="collapse"]').first();
        await toggler.click();
        await page.waitForTimeout(300);

        const targetId = await toggler.getAttribute('data-cdx-target');
        const desktopId = targetId!.replace('#', '');
        const mobileId = 'xs-' + desktopId;

        const mobileSibling = page.locator(`#${mobileId}`);
        if (await mobileSibling.count() > 0) {
            await expect(mobileSibling).toHaveClass(/\bin\b/);
        }
    });
});

test.describe('Mobile menu', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('hamburger button toggles mobile menu', async ({ page }) => {
        await page.goto('/');

        const menu = page.locator('#mobile-menu');
        await expect(menu).not.toBeVisible();

        await page.locator('[data-cdx-mobile-toggle]').click();
        await expect(menu).toBeVisible();

        await page.locator('[data-cdx-mobile-toggle]').click();
        await expect(menu).not.toBeVisible();
    });

    test('mobile menu closes on navigation', async ({ page }) => {
        await page.goto('/');

        await page.locator('[data-cdx-mobile-toggle]').click();
        const menu = page.locator('#mobile-menu');
        await expect(menu).toBeVisible();

        // Expand a section first, then click a visible link
        const toggler = menu.locator('[data-cdx-toggle="collapse"]').first();
        await toggler.click();
        await page.waitForTimeout(300);

        const link = menu.locator('a[data-type="entity-link"]').first();
        if (await link.isVisible()) {
            await link.click();
            await page.waitForTimeout(300);
            await expect(menu).not.toBeVisible();
        }
    });
});

test.describe('Mobile menu auto-close on resize', () => {
    test('closes when viewport exceeds 768px', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');

        await page.locator('[data-cdx-mobile-toggle]').click();
        const menu = page.locator('#mobile-menu');
        await expect(menu).toBeVisible();

        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(200);
        await expect(menu).not.toBeVisible();
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

    test('opens when sidebar search input is focused', async ({ page }) => {
        await page.goto('/');

        // Click the search input container (readonly input triggers focus -> opens palette)
        await page.locator('.d-none.d-md-block #book-search-input input').click();
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

        // Playwright colorScheme: 'dark' means dark mode is ON initially.
        // Toggle it OFF, verify, toggle back ON, verify.
        await page.evaluate(() => {
            const input = document.querySelector('.dark-mode-switch input') as HTMLInputElement;
            input?.click();
        });
        await page.waitForTimeout(100);

        const noDark = await page.evaluate(() =>
            !document.documentElement.classList.contains('dark') &&
            !document.body.classList.contains('dark')
        );
        expect(noDark).toBe(true);

        // Toggle back ON
        await page.evaluate(() => {
            const input = document.querySelector('.dark-mode-switch input') as HTMLInputElement;
            input?.click();
        });
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
        const toggler = page.locator('.d-none.d-md-block.menu [data-cdx-toggle="collapse"]').first();
        await toggler.click();
        await page.waitForTimeout(300);

        const entityLink = page.locator('.d-none.d-md-block.menu a[data-type="entity-link"]').first();
        if (await entityLink.count() > 0) {
            // Mark the sidebar DOM to verify it wasn't replaced
            await page.evaluate(() => {
                document.querySelector('.d-none.d-md-block.menu')?.setAttribute('data-spa-marker', '1');
            });

            await entityLink.click();
            await page.waitForTimeout(500);

            // URL changed
            expect(page.url()).not.toBe(initialUrl);

            // Sidebar DOM was preserved (not replaced)
            const marker = await page.evaluate(() =>
                document.querySelector('.d-none.d-md-block.menu')?.getAttribute('data-spa-marker')
            );
            expect(marker).toBe('1');
        }
    });

    test('content scripts execute after SPA navigation', async ({ page }) => {
        await page.goto('/');

        const routesLink = page.locator('.d-none.d-md-block.menu a[href="routes.html"]');
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

        const browseBtn = page.locator('a.btn:has-text("Browse")').first();
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
