import { expect, test } from '@playwright/test';

test.describe('Empty States', () => {
    test.describe('Page variant — bare entity with no members', () => {
        test('class with no members shows page empty state', async ({ page }) => {
            await page.goto('/classes/Tada.html');

            const info = page.locator('#info');
            const emptyState = info.locator('.cdx-empty-state--page');
            await expect(emptyState).toBeVisible();

            await expect(emptyState.locator('.cdx-empty-state-title')).toHaveText(
                'Nothing documented yet'
            );
            await expect(emptyState.locator('.cdx-empty-state-description')).toContainText(
                'no documented members'
            );
            await expect(emptyState.locator('.cdx-empty-state-icon')).toBeVisible();
        });

        test('page empty state shows file path in hero', async ({ page }) => {
            await page.goto('/classes/Tada.html');

            const filePath = page.locator('.cdx-entity-hero-file');
            await expect(filePath).toBeVisible();
            await expect(filePath).toContainText('.ts');
        });
    });

    test.describe('Full variant — empty tabs', () => {
        test('heading-only README shows heading + empty state', async ({ page }) => {
            await page.goto('/classes/Todo.html');

            const readmeTab = page.locator('[role="tab"]', { hasText: 'README' });
            await readmeTab.click();

            const readmePanel = page.locator('#readme');
            const emptyState = readmePanel.locator('.cdx-empty-state--full');
            await expect(emptyState).toBeVisible();
            await expect(emptyState.locator('.cdx-empty-state-title')).toHaveText('No README');

            // Heading should still be visible above empty state
            const heading = readmePanel.locator('h1, h2, h3');
            await expect(heading).toBeVisible();
        });

        test('source tab with content does NOT show empty state', async ({ page }) => {
            await page.goto('/classes/Todo.html');

            const sourceTab = page.locator('[role="tab"]', { hasText: 'Source' });
            await sourceTab.click();

            const sourcePanel = page.locator('#source');
            await expect(sourcePanel.locator('.cdx-empty-state')).not.toBeVisible();
            await expect(sourcePanel.locator('.cdx-source-viewer')).toBeVisible();
        });
    });

    test.describe('No empty sections — component pages', () => {
        test('component without inputs does not render empty Inputs heading', async ({ page }) => {
            await page.goto('/components/AppComponent.html');

            const info = page.locator('#info');
            const inputsHeading = info.locator('h3', { hasText: /^Inputs$/ });
            await expect(inputsHeading).toHaveCount(0);
        });

        test('component without outputs does not render empty Outputs heading', async ({
            page
        }) => {
            await page.goto('/components/AppComponent.html');

            const info = page.locator('#info');
            const outputsHeading = info.locator('h3', { hasText: /^Outputs$/ });
            await expect(outputsHeading).toHaveCount(0);
        });

        test('component without host bindings does not render empty HostBindings heading', async ({
            page
        }) => {
            await page.goto('/components/AppComponent.html');

            const info = page.locator('#info');
            const hbHeading = info.locator('h3', { hasText: /^HostBindings$/ });
            await expect(hbHeading).toHaveCount(0);
        });

        test('component with inputs DOES render Inputs section', async ({ page }) => {
            await page.goto('/components/AboutComponent.html');

            const info = page.locator('#info');
            const inputsHeading = info.locator('h3', { hasText: /^Inputs$/ });
            await expect(inputsHeading).toBeVisible();

            const memberCards = info.locator('[data-compodoc="block-inputs"] .cdx-member-card');
            await expect(memberCards).not.toHaveCount(0);
        });
    });

    test.describe('Entity page with content — no false empty states', () => {
        test('class with members does NOT show page empty state', async ({ page }) => {
            await page.goto('/classes/Clock.html');

            const info = page.locator('#info');
            await expect(info.locator('.cdx-empty-state--page')).not.toBeVisible();
            await expect(info.locator('h3', { hasText: 'Properties' })).toBeVisible();
        });

        test('component with full content has no empty states on info tab', async ({ page }) => {
            await page.goto('/components/AboutComponent.html');

            const info = page.locator('#info');
            await expect(info.locator('.cdx-empty-state')).not.toBeVisible();
        });
    });
});
