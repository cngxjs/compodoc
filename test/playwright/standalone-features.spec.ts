import { test, expect } from '@playwright/test';

// ─── Sidebar ─────────────────────────────────────────────

test.describe('Sidebar', () => {
    test('standalone app: no modules section', async ({ page }) => {
        await page.goto('/');
        const html = await page.content();
        expect(html).not.toContain('chapter modules');
    });

    test('standalone badges on component links', async ({ page }) => {
        await page.goto('/');
        const html = await page.content();
        const matches = html.match(/cdx-badge--standalone/g) || [];
        expect(matches.length).toBeGreaterThanOrEqual(3);
    });

    test('token badges on injectable links', async ({ page }) => {
        await page.goto('/');
        const html = await page.content();
        const matches = html.match(/cdx-badge--token/g) || [];
        expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    test('beta badge on UserCardComponent link', async ({ page }) => {
        await page.goto('/');
        const html = await page.content();
        expect(html).toContain('UserCardComponent');
        expect(html).toContain('cdx-badge--beta');
    });

    test('category grouping under injectables', async ({ page }) => {
        await page.goto('/');
        const html = await page.content();
        expect(html).toContain('Configuration');
        expect(html).toContain('Services');
    });
});

// ─── Component pages ─────────────────────────────────────

test.describe('Component page', () => {
    test('breadcrumb shows Standalone badge', async ({ page }) => {
        await page.goto('/components/AppComponent.html');
        const badge = page.locator('.cdx-entity-hero-badges .cdx-badge--standalone');
        expect(await badge.count()).toBe(1);
        expect(await badge.textContent()).toBe('Standalone');
    });

    test('UserCardComponent: beta and since badges', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        expect(await page.locator('.cdx-entity-hero-badges .cdx-badge--beta').count()).toBe(1);
        expect(await page.locator('.cdx-entity-hero-badges .cdx-badge--since').count()).toBe(1);
        expect(await page.locator('.cdx-entity-hero-badges .cdx-badge--since').textContent()).toContain('v1.0.0');
    });

    test('UserCardComponent: content slots section', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const html = await page.content();
        expect(html).toContain('Content Slots');
        expect(html).toContain('actions');
    });

    test('UserCardComponent: Storybook and Figma external links', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const html = await page.content();
        expect(html).toContain('storybook.example.com');
        expect(html).toContain('figma.com');
        expect(await page.locator('.cdx-ext-link').count()).toBeGreaterThanOrEqual(1);
    });

    test('UserListComponent: zoneless badge', async ({ page }) => {
        await page.goto('/components/UserListComponent.html');
        const badge = page.locator('.cdx-entity-hero-badges .cdx-badge--zoneless');
        expect(await badge.count()).toBe(1);
        expect(await badge.textContent()).toBe('Zoneless');
    });

    test('UserCardComponent: relationship graph shows used-by and depends-on', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const section = page.locator('[data-compodoc="block-relationships"]');
        expect(await section.count()).toBe(1);
        const text = await section.textContent();
        expect(text).toContain('Used by');
        expect(text).toContain('UserListComponent');
        expect(text).toContain('Depends on');
        expect(text).toContain('HighlightDirective');
    });

    test('no empty entryComponents section', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        expect(await page.content()).not.toContain('entryComponents');
    });
});

// ─── Directive page ──────────────────────────────────────

test.describe('Directive page', () => {
    test('HighlightDirective: standalone badge', async ({ page }) => {
        await page.goto('/directives/HighlightDirective.html');
        expect(await page.locator('.cdx-entity-hero-badges .cdx-badge--standalone').count()).toBe(1);
    });
});

// ─── Pipe page ───────────────────────────────────────────

test.describe('Pipe page', () => {
    test('GreetingPipe: standalone badge', async ({ page }) => {
        await page.goto('/pipes/GreetingPipe.html');
        expect(await page.locator('.cdx-entity-hero-badges .cdx-badge--standalone').count()).toBe(1);
    });
});

// ─── Injectable / Token pages ────────────────────────────

test.describe('Injectable page', () => {
    test('API_BASE_URL: token badge in breadcrumb', async ({ page }) => {
        await page.goto('/injectables/API_BASE_URL.html');
        expect(await page.locator('.cdx-entity-hero-badges .cdx-badge--token').count()).toBe(1);
    });

    test('API_BASE_URL: token metadata shows type and providedIn', async ({ page }) => {
        await page.goto('/injectables/API_BASE_URL.html');
        const metadata = page.locator('[data-compodoc="block-metadata"]');
        expect(await metadata.count()).toBe(1);
        const text = await metadata.textContent();
        expect(text).toContain('Type');
        expect(text).toContain('string');
        expect(text).toContain('Provided in');
        expect(text).toContain("'root'");
    });

    test('FEATURE_FLAGS: token badge', async ({ page }) => {
        await page.goto('/injectables/FEATURE_FLAGS.html');
        expect(await page.locator('.cdx-entity-hero-badges .cdx-badge--token').count()).toBe(1);
    });
});

// ─── Miscellaneous functions ─────────────────────────────

test.describe('Functions page', () => {
    test('factory function badges rendered', async ({ page }) => {
        await page.goto('/miscellaneous/functions.html');
        const html = await page.content();
        expect(html).toContain('cdx-badge--factory');
        expect(html).toContain('Provider');
        expect(html).toContain('Feature');
        expect(html).toContain('Inject');
        expect(html).toContain('Factory');
    });

    test('signal badge on injectUserCount', async ({ page }) => {
        await page.goto('/miscellaneous/functions.html');
        const html = await page.content();
        expect(html).toContain('cdx-badge--signal');
        expect(html).toContain('injectUserCount');
    });

    test('beta badge on withCaching', async ({ page }) => {
        await page.goto('/miscellaneous/functions.html');
        const html = await page.content();
        expect(html).toContain('cdx-badge--beta');
        expect(html).toContain('withCaching');
    });
});

// ─── Signal detection ────────────────────────────────────

test.describe('Signal primitives', () => {
    test('UserCardComponent properties show signal kind badges', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const html = await page.content();
        expect(html).toContain('cdx-badge--signal');
        expect(html).toContain('cdx-badge--computed');
        expect(html).toContain('cdx-badge--effect');
    });

    test('UserCardComponent input shows input-signal badge', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const html = await page.content();
        expect(html).toContain('cdx-badge--input-signal');
    });

    test('UserCardComponent output shows output-signal badge', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const html = await page.content();
        expect(html).toContain('cdx-badge--output-signal');
    });

    test('UserCardComponent shows viewChild signal query', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const html = await page.content();
        expect(html).toContain('cdx-badge--view-child');
    });

    test('UserCardComponent shows inject() DI badge', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const html = await page.content();
        expect(html).toContain('cdx-badge--inject');
        expect(html).toContain('apiUrl');
    });

    test('required input shows Required badge', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const html = await page.content();
        expect(html).toContain('Required');
    });
});

// ─── Host metadata ───────────────────────────────────────

test.describe('Host metadata bindings', () => {
    test('HighlightDirective shows host bindings from metadata', async ({ page }) => {
        await page.goto('/directives/HighlightDirective.html');
        const html = await page.content();
        expect(html).toContain('class.highlighted');
        expect(html).toContain('attr.data-highlight');
    });

    test('HighlightDirective shows host listeners from metadata', async ({ page }) => {
        await page.goto('/directives/HighlightDirective.html');
        const html = await page.content();
        expect(html).toContain('mouseenter');
        expect(html).toContain('mouseleave');
    });
});

// ─── App Configuration ───────────────────────────────────

test.describe('App Configuration', () => {
    test('app-config.html shows provider cards', async ({ page }) => {
        await page.goto('/app-config.html');
        const html = await page.content();
        expect(html).toContain('Application Configuration');
        expect(html).toContain('provideRouter');
        expect(html).toContain('cdx-provider-card');
    });

    test('provider features are shown as badges', async ({ page }) => {
        await page.goto('/app-config.html');
        const html = await page.content();
        expect(html).toContain('withComponentInputBinding');
    });

    test('sidebar shows App Configuration link', async ({ page }) => {
        await page.goto('/');
        const html = await page.content();
        expect(html).toContain('app-config.html');
        expect(html).toContain('App Configuration');
    });
});

// ─── Dependency Graph ───────────────────────────────────

test.describe('Dependency Graph — Overview', () => {
    test('dependency graph container present (standalone app, no modules)', async ({ page }) => {
        await page.goto('/overview.html');
        const container = page.locator('#dependency-graph-container');
        await expect(container).toBeVisible();
    });

    test('SVG rendered with role=img and aria-label', async ({ page }) => {
        await page.goto('/overview.html');
        const svg = page.locator('#dependency-graph-container svg');
        await expect(svg).toBeVisible();
        await expect(svg).toHaveAttribute('role', 'img');
        await expect(svg).toHaveAttribute('aria-label', 'Standalone component dependency graph');
    });

    test('graph has entity-colored nodes', async ({ page }) => {
        await page.goto('/overview.html');
        const circles = page.locator('#dependency-graph-container circle');
        expect(await circles.count()).toBeGreaterThanOrEqual(3);
    });

    test('graph has arrow markers on edges', async ({ page }) => {
        await page.goto('/overview.html');
        const marker = page.locator('#dependency-graph-container marker#dep-arrow');
        await expect(marker).toHaveCount(1);
    });

    test('zoom buttons present', async ({ page }) => {
        await page.goto('/overview.html');
        await expect(page.locator('#dep-zoom-in')).toBeVisible();
        await expect(page.locator('#dep-reset')).toBeVisible();
        await expect(page.locator('#dep-zoom-out')).toBeVisible();
    });

    test('entity-color legend present', async ({ page }) => {
        await page.goto('/overview.html');
        const legend = page.locator('.cdx-graph-legend');
        await expect(legend).toBeVisible();
        const items = legend.locator('.cdx-graph-legend-item');
        expect(await items.count()).toBeGreaterThanOrEqual(5);
    });

    test('a11y: screen reader text alternative lists dependencies', async ({ page }) => {
        await page.goto('/overview.html');
        const srList = page.locator('ul.sr-only[aria-label="Component dependency list"]');
        await expect(srList).toHaveCount(1);
        const items = srList.locator('li');
        expect(await items.count()).toBeGreaterThanOrEqual(2);
        const text = await srList.textContent();
        expect(text).toContain('imports');
    });

    test('no module graph shown on standalone app overview', async ({ page }) => {
        await page.goto('/overview.html');
        await expect(page.locator('#module-graph-svg')).toHaveCount(0);
    });

    test('cursor: grab on graph SVG', async ({ page }) => {
        await page.goto('/overview.html');
        const svg = page.locator('#dependency-graph-container svg');
        const cursor = await svg.evaluate(el => getComputedStyle(el).cursor);
        expect(cursor).toBe('grab');
    });
});

test.describe('Dependency Graph — Component Tab', () => {
    test('Dependencies tab visible for standalone component with imports', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const tab = page.getByRole('tab', { name: 'Dependencies' });
        await expect(tab).toBeVisible();
    });

    test('Dependencies tab not shown for components without imports', async ({ page }) => {
        await page.goto('/components/SettingsComponent.html');
        const tab = page.getByRole('tab', { name: 'Dependencies' });
        await expect(tab).toHaveCount(0);
    });

    test('clicking Dependencies tab shows graph', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        await page.getByRole('tab', { name: 'Dependencies' }).click();
        const svg = page.locator('#dependency-graph-container svg');
        await expect(svg).toBeVisible();
    });

    test('per-component graph has clickable nodes', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        await page.getByRole('tab', { name: 'Dependencies' }).click();
        const nodes = page.locator('#dependency-graph-container .dep-node');
        expect(await nodes.count()).toBeGreaterThanOrEqual(2);
    });

    test('per-component a11y text alternative', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const srList = page.locator('#dependencies ul.sr-only');
        await expect(srList).toHaveCount(1);
        const text = await srList.textContent();
        expect(text).toContain('UserCardComponent imports');
    });

    test('per-component legend present', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        await page.getByRole('tab', { name: 'Dependencies' }).click();
        const legend = page.locator('#dependencies .cdx-graph-legend');
        await expect(legend).toBeVisible();
    });

    test('per-component zoom buttons present', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        await page.getByRole('tab', { name: 'Dependencies' }).click();
        await expect(page.locator('#dep-zoom-in')).toBeVisible();
    });
});
