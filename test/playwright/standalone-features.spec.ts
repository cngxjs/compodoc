import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const OUTPUT_DIR = path.join(__dirname, '../../.tmp-e2e-standalone');
const FIXTURE_DIR = path.join(__dirname, '../fixtures/standalone-app');

// Generate docs once before all tests (idempotent)
if (!fs.existsSync(path.join(OUTPUT_DIR, 'index.html'))) {
    execSync(
        `node ${path.join(__dirname, '../../bin/index-cli.js')} -p ./src/tsconfig.json -d ${OUTPUT_DIR} --silent`,
        { cwd: FIXTURE_DIR, timeout: 60000 }
    );
}

const BASE = `file://${OUTPUT_DIR}`;

// ─── Sidebar ─────────────────────────────────────────────

test.describe('Sidebar', () => {
    test('standalone app: no modules section', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);
        const html = await page.content();
        expect(html).not.toContain('chapter modules');
    });

    test('standalone badges on component links', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);
        const html = await page.content();
        // All 3 components should have standalone badges
        const matches = html.match(/cdx-badge--standalone/g) || [];
        // Desktop + mobile menus: at least 6 (3 per menu * 2 menus), plus directives + pipes
        expect(matches.length).toBeGreaterThanOrEqual(6);
    });

    test('token badges on injectable links', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);
        const html = await page.content();
        const matches = html.match(/cdx-badge--token/g) || [];
        // API_BASE_URL + FEATURE_FLAGS, in both desktop + mobile menus
        expect(matches.length).toBeGreaterThanOrEqual(4);
    });

    test('beta badge on UserCardComponent link', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);
        const html = await page.content();
        expect(html).toContain('UserCardComponent');
        expect(html).toContain('cdx-badge--beta');
    });

    test('category grouping under injectables', async ({ page }) => {
        await page.goto(`${BASE}/index.html`);
        const html = await page.content();
        expect(html).toContain('Configuration');
        expect(html).toContain('Services');
    });
});

// ─── Component pages ─────────────────────────────────────

test.describe('Component page', () => {
    test('breadcrumb shows Standalone badge', async ({ page }) => {
        await page.goto(`${BASE}/components/AppComponent.html`);
        const badge = page.locator('.breadcrumb .cdx-badge--standalone');
        expect(await badge.count()).toBe(1);
        expect(await badge.textContent()).toBe('Standalone');
    });

    test('UserCardComponent: beta and since badges', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        expect(await page.locator('.breadcrumb .cdx-badge--beta').count()).toBe(1);
        expect(await page.locator('.breadcrumb .cdx-badge--since').count()).toBe(1);
        expect(await page.locator('.breadcrumb .cdx-badge--since').textContent()).toContain('v1.0.0');
    });

    test('UserCardComponent: content slots section', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        const html = await page.content();
        expect(html).toContain('Content Slots');
        expect(html).toContain('actions');
    });

    test('UserCardComponent: Storybook and Figma external links', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        const html = await page.content();
        expect(html).toContain('storybook.example.com');
        expect(html).toContain('figma.com');
        expect(await page.locator('.cdx-ext-link').count()).toBeGreaterThanOrEqual(1);
    });

    test('UserListComponent: zoneless badge', async ({ page }) => {
        await page.goto(`${BASE}/components/UserListComponent.html`);
        const badge = page.locator('.breadcrumb .cdx-badge--zoneless');
        expect(await badge.count()).toBe(1);
        expect(await badge.textContent()).toBe('Zoneless');
    });

    test('UserCardComponent: relationship graph shows used-by and depends-on', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        const section = page.locator('[data-compodoc="block-relationships"]');
        expect(await section.count()).toBe(1);
        const text = await section.textContent();
        expect(text).toContain('Used by');
        expect(text).toContain('UserListComponent');
        expect(text).toContain('Depends on');
        expect(text).toContain('HighlightDirective');
    });

    test('no empty entryComponents section', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        expect(await page.content()).not.toContain('entryComponents');
    });
});

// ─── Directive page ──────────────────────────────────────

test.describe('Directive page', () => {
    test('HighlightDirective: standalone badge', async ({ page }) => {
        await page.goto(`${BASE}/directives/HighlightDirective.html`);
        expect(await page.locator('.breadcrumb .cdx-badge--standalone').count()).toBe(1);
    });
});

// ─── Pipe page ───────────────────────────────────────────

test.describe('Pipe page', () => {
    test('GreetingPipe: standalone badge', async ({ page }) => {
        await page.goto(`${BASE}/pipes/GreetingPipe.html`);
        expect(await page.locator('.breadcrumb .cdx-badge--standalone').count()).toBe(1);
    });
});

// ─── Injectable / Token pages ────────────────────────────

test.describe('Injectable page', () => {
    test('API_BASE_URL: token badge in breadcrumb', async ({ page }) => {
        await page.goto(`${BASE}/injectables/API_BASE_URL.html`);
        expect(await page.locator('.breadcrumb .cdx-badge--token').count()).toBe(1);
    });

    test('API_BASE_URL: token metadata shows type and providedIn', async ({ page }) => {
        await page.goto(`${BASE}/injectables/API_BASE_URL.html`);
        const metadata = page.locator('[data-compodoc="block-metadata"]');
        expect(await metadata.count()).toBe(1);
        const text = await metadata.textContent();
        expect(text).toContain('Type');
        expect(text).toContain('string');
        expect(text).toContain('Provided in');
        expect(text).toContain("'root'");
    });

    test('FEATURE_FLAGS: token badge', async ({ page }) => {
        await page.goto(`${BASE}/injectables/FEATURE_FLAGS.html`);
        expect(await page.locator('.breadcrumb .cdx-badge--token').count()).toBe(1);
    });
});

// ─── Miscellaneous functions ─────────────────────────────

test.describe('Functions page', () => {
    test('factory function badges rendered', async ({ page }) => {
        await page.goto(`${BASE}/miscellaneous/functions.html`);
        const html = await page.content();
        expect(html).toContain('cdx-badge--factory');
        expect(html).toContain('Provider');
        expect(html).toContain('Feature');
        expect(html).toContain('Inject');
        expect(html).toContain('Factory');
    });

    test('signal badge on injectUserCount', async ({ page }) => {
        await page.goto(`${BASE}/miscellaneous/functions.html`);
        const html = await page.content();
        expect(html).toContain('cdx-badge--signal');
        expect(html).toContain('injectUserCount');
    });

    test('beta badge on withCaching', async ({ page }) => {
        await page.goto(`${BASE}/miscellaneous/functions.html`);
        const html = await page.content();
        expect(html).toContain('cdx-badge--beta');
        expect(html).toContain('withCaching');
    });
});

// ─── Signal detection ────────────────────────────────────

test.describe('Signal primitives', () => {
    test('UserCardComponent properties show signal kind badges', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        const html = await page.content();
        // signal() primitive
        expect(html).toContain('cdx-badge--signal');
        // computed()
        expect(html).toContain('cdx-badge--computed');
        // effect()
        expect(html).toContain('cdx-badge--effect');
    });

    test('UserCardComponent input shows input-signal badge', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        const html = await page.content();
        expect(html).toContain('cdx-badge--input-signal');
    });

    test('UserCardComponent output shows output-signal badge', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        const html = await page.content();
        expect(html).toContain('cdx-badge--output-signal');
    });

    test('UserCardComponent shows viewChild signal query', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        const html = await page.content();
        expect(html).toContain('cdx-badge--view-child');
    });

    test('UserCardComponent shows inject() DI badge', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        const html = await page.content();
        expect(html).toContain('cdx-badge--inject');
        expect(html).toContain('apiUrl');
    });

    test('required input shows Required badge', async ({ page }) => {
        await page.goto(`${BASE}/components/UserCardComponent.html`);
        const html = await page.content();
        // input.required<User>() should show Required
        expect(html).toContain('Required');
    });
});

// ─── Host metadata ───────────────────────────────────────

test.describe('Host metadata bindings', () => {
    test('HighlightDirective shows host bindings from metadata', async ({ page }) => {
        await page.goto(`${BASE}/directives/HighlightDirective.html`);
        const html = await page.content();
        expect(html).toContain('class.highlighted');
        expect(html).toContain('attr.data-highlight');
    });

    test('HighlightDirective shows host listeners from metadata', async ({ page }) => {
        await page.goto(`${BASE}/directives/HighlightDirective.html`);
        const html = await page.content();
        expect(html).toContain('mouseenter');
        expect(html).toContain('mouseleave');
    });
});
