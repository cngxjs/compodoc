import { test, expect } from '@playwright/test';

test.describe('Compodoc page', () => {
    test('should support dark mode', async ({ page }) => {
        await page.goto('/');

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
