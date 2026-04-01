import { test, expect } from '@playwright/test';

test.describe('Compodoc page', () => {
    // TODO: Pagefind search is async (WASM + index fetch) -- re-enable after --serve
    // switches to sirv (Phase 2.5) which properly serves pagefind/ static assets
    test.skip('should have a search bar, and handle results', async ({ page }) => {
        await page.goto('/?q=exampleInput');

        const searchResults = page.locator('.search-results-item');
        await expect(searchResults).toHaveCount(1, { timeout: 10000 });
    });

    test('should have a search bar, and handle results empty', async ({ page }) => {
        await page.goto('/?q=waza');

        const searchResults = await page.locator('.search-results-item');
        const searchResultsCount = await searchResults.count();
        await expect(searchResultsCount).toEqual(0);
    });

    test('should support dark mode', async ({ page }) => {
        await page.goto('/?q=waza');

        const backgroundColor = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });

        await expect(backgroundColor).toEqual('rgb(33, 33, 33)');
    });

    test('should open menu for specific page', async ({ page }) => {
        await page.goto('/modules.html');

        const menuModulesItem = await page.locator('.d-md-block.menu .menu-toggler').nth(0);
        await expect(menuModulesItem).toHaveClass(/linked/);
    });
});
