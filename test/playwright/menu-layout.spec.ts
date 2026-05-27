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

    test('tagged miscellaneous symbols get dedicated detail pages, untagged stay as anchors', async ({
        page
    }) => {
        // Standalone-app fixture has provideUserFeature + createDefaultUser
        // tagged with @category (Providers, Factories) and roleGuard untagged.
        const features = page.locator('#features-links');

        const tagged = features.locator(
            'a[data-cdx-entity-type="function"][href$="provideUserFeature.html"]'
        );
        await expect(tagged).toHaveCount(1);

        const anchor = features.locator(
            'a[data-cdx-entity-type="function"][href*="functions.html#roleGuard"]'
        );
        await expect(anchor).toHaveCount(1);

        // The dedicated detail page must actually exist and render the entity name.
        const detailUrl = await tagged.getAttribute('href');
        await page.goto(detailUrl as string);
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('h1.cdx-entity-hero-name')).toContainText('provideUserFeature');
    });

    test('hero breadcrumb mirrors the sidebar bucket path in feature layout', async ({ page }) => {
        // Tagged misc symbol — breadcrumb from @category.
        await page.goto('/miscellaneous/functions/provideUserFeature.html');
        await page.waitForLoadState('domcontentloaded');
        const taggedCrumbs = page.locator('.cdx-breadcrumb li').allInnerTexts();
        await expect(page.locator('.cdx-breadcrumb li').first()).toHaveText('Providers');
        await expect(page.locator('.cdx-breadcrumb li').last()).toHaveText('provideUserFeature');
        // Sanity-check: no kind label in the breadcrumb (would be 'Miscellaneous'/'Functions')
        const labels = await taggedCrumbs;
        expect(labels.some(t => t === 'Miscellaneous' || t === 'Functions')).toBe(false);

        // Untagged component — folder-fallback derived path.
        await page.goto('/components/DashboardComponent.html');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('.cdx-breadcrumb li').first()).toHaveText('dashboard');
    });

    test('anchor links on miscellaneous collection pages scroll to the row', async ({ page }) => {
        // Untagged misc symbol — sidebar link form is `<plural>.html#<name>`.
        // The element is NOT inside a `.cdx-tab-panel`, so the pre-fix
        // resolveHash returned null and the SPA scroll never fired.
        await page.goto('/miscellaneous/functions.html#roleGuard');
        await page.waitForLoadState('domcontentloaded');

        const row = page.locator('#roleGuard');
        await expect(row).toBeInViewport();
    });
});
