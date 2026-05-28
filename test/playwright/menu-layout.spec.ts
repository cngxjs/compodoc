import { expect, test } from '@playwright/test';

// Runs against the standalone-app fixture rebuilt with menuLayout: 'feature'
// (see playwright project `standalone-feature`, port 4004). v0.6.0 splits
// the cross-kind sidebar into two chapters: Features (components, directives,
// pipes, injectables, classes, guards, interceptors, entities) and References
// (interfaces, functions, typealiases, variables, enumerations). Both share
// the same @category / folder bucket paths.

test.describe('menuLayout: "feature" sidebar', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForLoadState('domcontentloaded');
    });

    test('renders Features + References chapters and no per-kind chapters', async ({ page }) => {
        await expect(page.locator('#features-links')).toHaveCount(1);
        await expect(page.locator('#references-links')).toHaveCount(1);
        // The per-kind chapters that exist in default-layout standalone-doc
        // must NOT be rendered under feature layout.
        await expect(page.locator('#components-links')).toHaveCount(0);
        await expect(page.locator('#directives-links')).toHaveCount(0);
        await expect(page.locator('#injectables-links')).toHaveCount(0);
        await expect(page.locator('#pipes-links')).toHaveCount(0);
    });

    test('Miscellaneous chapter is suppressed in feature mode (everything in References)', async ({
        page
    }) => {
        // Miscellaneous is redundant under feature layout — functions /
        // variables / typealiases / enumerations all live in References.
        await expect(page.locator('#miscellaneous-links')).toHaveCount(0);
    });

    test('Features chapter mixes primary-kind entities in one bucket', async ({ page }) => {
        // The admin-settings folder in the standalone fixture bundles a
        // service (injectable) with three components — exercises the cross-
        // kind mixing the chapter is built for.
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

    test('entity links inside Features chapter point at per-kind detail pages', async ({
        page
    }) => {
        const componentLink = page.locator('#features-links a[data-cdx-entity-type="component"]');
        const first = componentLink.first();
        await expect(first).toHaveAttribute('href', /(?:\.\/)?components\/[A-Za-z]+\.html$/);
    });

    test('References chapter is exhaustive — lists every public symbol per bucket', async ({
        page
    }) => {
        // References is the API surface: every kind appears here, including
        // primary-kind organisms that already surface under Features. Same
        // bucket paths as Features, but a different chapter id.
        const refs = page.locator('#references-links');
        await expect(refs).toHaveCount(1);
        // Both a function (reference-kind) AND a component (primary-kind)
        // surface under References — the bifurcation is no longer disjoint.
        await expect(refs.locator('a[data-cdx-entity-type="function"]').first()).toBeAttached();
        await expect(refs.locator('a[data-cdx-entity-type="component"]').first()).toBeAttached();
    });

    test('primary-kind components surface under BOTH Features and References (TOC + index pattern)', async ({
        page
    }) => {
        // Pick any standalone component from the fixture — `DashboardComponent`
        // is the canonical one. It MUST appear in both chapters. Same target
        // page, different default tab — Features stays default Info,
        // References appends `#api` to open the API tab on page load.
        // The hrefs render with a relative-URL `./` prefix on the home page;
        // ends-with matchers stay resilient to depth-dependent prefixes.
        const inFeatures = page.locator(
            '#features-links a[href$="components/DashboardComponent.html"]'
        );
        const inReferences = page.locator(
            '#references-links a[href$="components/DashboardComponent.html#api"]'
        );
        await expect(inFeatures).toHaveCount(1);
        await expect(inReferences).toHaveCount(1);
    });

    test('References-chapter links open the API tab on page load (#api default)', async ({
        page
    }) => {
        // The link contract: References chapter appends `#api` to its
        // sidebar hrefs for kinds with an API tab. Visibility may be
        // collapsed by toggleMenuItems — DOM count is enough.
        const link = page.locator('#references-links a[href$=".html#api"]').first();
        await expect(link).toHaveCount(1);

        // Pick a component that actually renders an API tab (has inputs,
        // outputs, or other members). DashboardComponent has none, so the
        // ComponentPage strips the API tab; AppComponent has `routes` and
        // therefore keeps it. Navigate directly so we don't depend on the
        // collapsed-chapter visibility.
        await page.goto('/components/AppComponent.html#api');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('.cdx-tab-panel#api')).toHaveClass(/active/);
    });

    test('entity heroes emit Pagefind meta attrs (kind, category, description)', async ({
        page
    }) => {
        // Reference-kind page first — confirms `data-pagefind-meta-kind`
        // surfaces "Interface", and description excerpt is HTML-stripped.
        await page.goto('/miscellaneous/functions/provideUserFeature.html');
        await page.waitForLoadState('domcontentloaded');
        const hero = page.locator('.cdx-entity-hero').first();
        await expect(hero).toHaveAttribute('data-pagefind-meta-kind', 'Function');
        await expect(hero).toHaveAttribute('data-pagefind-meta-category', 'Providers');
        // Description is optional but should be present for this fixture
        // (provideUserFeature has JSDoc in the standalone-app fixture).
        const description = await hero.getAttribute('data-pagefind-meta-description');
        expect(description?.length).toBeGreaterThan(0);

        // Primary-kind component — same contract, different kind label.
        await page.goto('/components/DashboardComponent.html');
        await page.waitForLoadState('domcontentloaded');
        const componentHero = page.locator('.cdx-entity-hero').first();
        await expect(componentHero).toHaveAttribute('data-pagefind-meta-kind', 'Component');
    });

    test('tagged miscellaneous symbols get dedicated detail pages, untagged stay as anchors', async ({
        page
    }) => {
        // standalone-app fixture: provideUserFeature + createDefaultUser are
        // @category-tagged, roleGuard is untagged. All three are functions and
        // now live in References, not Features. Tagged detail-page links also
        // carry `#api` per the References-chapter default; anchor-style URLs
        // keep their existing `#<name>` fragment.
        const refs = page.locator('#references-links');

        const tagged = refs.locator(
            'a[data-cdx-entity-type="function"][href*="provideUserFeature.html"]'
        );
        await expect(tagged).toHaveCount(1);

        const anchor = refs.locator(
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
        const labels = await taggedCrumbs;
        expect(labels.some(t => t === 'Miscellaneous' || t === 'Functions')).toBe(false);

        // Untagged component — folder-fallback derived path.
        await page.goto('/components/DashboardComponent.html');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('.cdx-breadcrumb li').first()).toHaveText('dashboard');
    });

    test('anchor links on miscellaneous collection pages scroll to the row', async ({ page }) => {
        // Untagged misc symbol — sidebar link form is `<plural>.html#<name>`.
        await page.goto('/miscellaneous/functions.html#roleGuard');
        await page.waitForLoadState('domcontentloaded');

        const row = page.locator('#roleGuard');
        await expect(row).toBeInViewport();
    });

    test('cdx-chip[href] has hover + focus affordance', async ({ page }) => {
        // Any rendered chip with an href should have cursor:pointer per the v0.6.0 affordance.
        await page.goto('/miscellaneous/functions/provideUserFeature.html');
        await page.waitForLoadState('domcontentloaded');
        // The "Providers" category chip in the entity hero is a static badge
        // (no href). Look for a chip that IS a link — chips appearing in
        // MetadataChipsRow on entity pages, for example. We test the CSS rule
        // by injecting a link-chip and asserting the computed cursor.
        const cursor = await page.evaluate(() => {
            const anchor = document.createElement('a');
            anchor.className = 'cdx-chip cdx-chip--component';
            anchor.href = '#';
            anchor.textContent = 'TestChip';
            document.body.appendChild(anchor);
            const cs = getComputedStyle(anchor);
            const value = cs.cursor;
            anchor.remove();
            return value;
        });
        expect(cursor).toBe('pointer');
    });
});
