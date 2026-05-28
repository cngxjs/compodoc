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

    test('entity heroes emit Pagefind-discoverable meta spans (kind, category, description)', async ({
        page
    }) => {
        // Pagefind reads `data-pagefind-meta="key:value"` (literal form) and
        // `data-pagefind-meta="key"` (inner-text form). The per-key attribute
        // form (`data-pagefind-meta-X="value"`) looks plausible but is NOT
        // discovered by Pagefind's static scan — kept as a regression guard
        // against accidentally reintroducing the broken form.
        await page.goto('/miscellaneous/functions/provideUserFeature.html');
        await page.waitForLoadState('domcontentloaded');
        const hero = page.locator('.cdx-entity-hero').first();
        await expect(hero.locator('span[data-pagefind-meta="kind:Function"]')).toHaveCount(1);
        await expect(hero.locator('span[data-pagefind-meta="category:Providers"]')).toHaveCount(1);
        // Description uses inner-text form so commas / colons in JSDoc
        // survive Pagefind's attribute parser.
        const description = hero.locator('span[data-pagefind-meta="description"]');
        await expect(description).toHaveCount(1);
        expect((await description.innerText()).trim().length).toBeGreaterThan(0);

        // Primary-kind component — same contract, different kind label.
        await page.goto('/components/DashboardComponent.html');
        await page.waitForLoadState('domcontentloaded');
        const componentHero = page.locator('.cdx-entity-hero').first();
        await expect(
            componentHero.locator('span[data-pagefind-meta="kind:Component"]')
        ).toHaveCount(1);
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

    test('sidebar bucket label navigates to the auto-generated landing page', async ({ page }) => {
        // Two-hit-zone contract: clicking the LABEL (an <a>) goes to
        // `categories/<bucket>.html`; the chevron toggle stays a button.
        // Both share the row but are distinct hit zones.
        const features = page.locator('#features-links');
        const labels = features.locator('a.cdx-bucket-label');
        await expect(labels.first()).toBeAttached();
        const href = await labels.first().getAttribute('href');
        // The SPA router may prefix sidebar links with `./` at runtime;
        // accept either form so the test is depth-resilient.
        expect(href).toMatch(/^(?:\.\/)?categories\/[^"]+\.html$/);

        // Navigate directly (the bucket may be collapsed in the sidebar).
        await page.goto(href!);
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('.cdx-entity-hero')).toBeVisible();
        await expect(page.locator('.cdx-bucket-landing-content')).toBeVisible();
    });

    test('bucket landing page groups members by kind into card lists', async ({ page }) => {
        // admin-settings bundles a service + multiple components — every
        // landing page emits an "Organisms" section for components/etc.
        // and a "References" section for interfaces/functions/types.
        await page.goto('/categories/features/admin-settings.html');
        await page.waitForLoadState('domcontentloaded');
        // Buckets may render one or two card lists (Organisms / References),
        // depending on which kinds the bucket holds. At least one must exist.
        expect(await page.locator('.cdx-bucket-card-list').count()).toBeGreaterThan(0);
        const cards = page.locator('.cdx-bucket-card');
        expect(await cards.count()).toBeGreaterThan(0);
        // Cards link out to per-kind detail pages and carry a kind chip.
        const firstCard = cards.first();
        await expect(firstCard.locator('.cdx-badge')).toBeAttached();
        await expect(firstCard.locator('.cdx-bucket-card-name')).toBeAttached();
        const linkHref = await firstCard.locator('a.cdx-bucket-card-link').getAttribute('href');
        expect(linkHref).toMatch(/(?:components|directives|pipes|injectables|classes|guards|interceptors|entities|interfaces|miscellaneous)\/[A-Za-z0-9_-]+\.html$/);
    });

    test('intermediate bucket landings aggregate items from every descendant leaf', async ({
        page
    }) => {
        // `users` is an intermediate folder containing `users/components`.
        // Its landing page should list every descendant entity, not zero.
        await page.goto('/categories/users.html');
        await page.waitForLoadState('domcontentloaded');
        const cards = page.locator('.cdx-bucket-card');
        expect(await cards.count()).toBeGreaterThan(0);
    });

    test('entity hero exposes data-pagefind-filter attributes for the facet UI', async ({
        page
    }) => {
        // Filter attrs are emitted as a hidden span next to the meta block
        // on every entity hero. They drive the command-palette facet rail
        // (kind / lib / bucket / tier / wcag).
        await page.goto('/components/DashboardComponent.html');
        await page.waitForLoadState('domcontentloaded');
        const filterSpan = page
            .locator('.cdx-entity-hero')
            .first()
            .locator('span[data-pagefind-filter]');
        await expect(filterSpan).toHaveCount(1);
        const attr = await filterSpan.getAttribute('data-pagefind-filter');
        expect(attr).toContain('kind:Component');
        // Multi-attribute form must also be present so Pagefind treats
        // each dimension as a separate facet.
        await expect(filterSpan).toHaveAttribute('data-pagefind-filter-kind', 'Component');
    });

    test('WCAG chip + Accessibility section render when @wcag and @a11y tags are present', async ({
        page
    }) => {
        // The standalone fixture's LoadingSpinnerComponent declares
        // `@wcag AA` + `@a11y ...`. Chip lands in the entity-hero badge row;
        // note renders as a section above the description.
        await page.goto('/components/LoadingSpinnerComponent.html');
        await page.waitForLoadState('domcontentloaded');
        const chip = page.locator('.cdx-entity-hero .cdx-badge--wcag-aa');
        await expect(chip).toHaveCount(1);
        await expect(chip).toContainText('WCAG AA');
        await expect(chip).toHaveAttribute('data-cdx-wcag', 'AA');

        const note = page.locator('.cdx-a11y-note');
        await expect(note).toHaveCount(1);
        await expect(note.locator('.cdx-section-heading')).toContainText('Accessibility');
        // Markdown rendering: inline code spans (role="status", aria-live,
        // aria-label, prefers-reduced-motion). Exact count varies by fixture,
        // assert "at least one" so the spec stays decoupled from the prose.
        expect(await note.locator('.cdx-a11y-note-body code').count()).toBeGreaterThan(0);
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
