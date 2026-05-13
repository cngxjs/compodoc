import { expect, test } from '@playwright/test';

// Runs against the standalone-app fixture rebuilt with menuLayout: 'feature'
// (see playwright project `standalone-feature`, port 4004). The fixture mixes
// components, directives, injectables across feature folders — the test
// asserts the cross-kind chapter replaces every per-kind chapter while
// preserving entity link targets.

test.describe('menuLayout: "feature" sidebar', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForLoadState('domcontentloaded');
    });

    test('renders a single cross-kind features chapter and no per-kind chapters', async ({
        page
    }) => {
        await expect(page.locator('#features-links')).toHaveCount(1);
        // The per-kind chapters that exist in default-layout standalone-doc
        // must NOT be rendered under feature layout.
        await expect(page.locator('#components-links')).toHaveCount(0);
        await expect(page.locator('#directives-links')).toHaveCount(0);
        await expect(page.locator('#injectables-links')).toHaveCount(0);
        await expect(page.locator('#pipes-links')).toHaveCount(0);
    });

    test('Modules / Miscellaneous / Additional Pages chapters survive at top level', async ({
        page
    }) => {
        // Standalone-app has no NgModules, so we only assert the doc-org
        // chapters that the fixture actually produces.
        await expect(page.locator('#miscellaneous-links')).toHaveCount(1);
    });

    test('feature folders mix entity kinds in one bucket', async ({ page }) => {
        // The admin-settings folder in the standalone fixture bundles a
        // service (injectable) with three components — exercises the cross-
        // kind mixing the layout is built for. Depth-0 and depth-1 groups
        // start expanded (groupDepth=2), so the bucket's `<ul>` already has
        // the `.in` class.
        const bucket = page
            .locator('#features-links')
            .locator('ul[id="features-group-features/admin-settings"]');
        await expect(bucket).toHaveCount(1);

        await expect(
            bucket.locator('> li.cdx-feature-link[data-cdx-kind="component"]').first()
        ).toBeAttached();
        await expect(
            bucket.locator('> li.cdx-feature-link[data-cdx-kind="injectable"]').first()
        ).toBeAttached();
    });

    test('entity links inside the features chapter point at the per-kind detail pages', async ({
        page
    }) => {
        // The home page renders relative URLs with `./` prefix; entity detail
        // pages use bare prefixes. Accept either form to keep the assertion
        // resilient across page contexts.
        const componentLink = page.locator('#features-links a[data-cdx-entity-type="component"]');
        const first = componentLink.first();
        await expect(first).toHaveAttribute('href', /(?:\.\/)?components\/[A-Za-z]+\.html$/);
    });
});
