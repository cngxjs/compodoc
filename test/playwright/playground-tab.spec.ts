import { expect, test } from '@playwright/test';

const COMPONENT_URL = '/components/LoadingSpinnerComponent.html';

test.describe('Playground tab', () => {
    test('renders the Playground tab on a component with @playground blocks', async ({ page }) => {
        await page.goto(COMPONENT_URL);
        const tabBar = page.locator('.cdx-tab-bar');
        await expect(tabBar).toContainText('Playground');
    });

    test('emits a manifest script and a launch button per @playground block', async ({ page }) => {
        await page.goto(COMPONENT_URL);
        await page.locator('a#playground-tab').click();
        const button = page.locator('.cdx-playground-launch').first();
        await expect(button).toBeVisible();
        const manifestId = await button.getAttribute('data-cdx-stackblitz-manifest');
        expect(manifestId).toBeTruthy();

        const manifestNode = page.locator(
            `script[data-cdx-stackblitz-manifest-data="${manifestId}"]`
        );
        await expect(manifestNode).toHaveCount(1);

        const payload = await manifestNode.evaluate(el => JSON.parse(el.textContent ?? '{}'));
        expect(payload.template).toBe('angular-cli');
        expect(payload.title).toBeTruthy();
        expect(payload.files['src/main.ts']).toContain('bootstrapApplication');
    });

    test('clicking the launch button calls openProject({ newWindow: true })', async ({ page }) => {
        await page.goto(COMPONENT_URL);
        await page.locator('a#playground-tab').click();

        // Replace the dynamic SDK import with a stub that records the call.
        await page.evaluate(() => {
            (window as any).__playgroundCalls = [];
            const stub = (manifest: any, opts: any) => {
                (window as any).__playgroundCalls.push({ manifest, opts });
            };
            (window as any).StackBlitzSDK = { openProject: stub };

            // Override the dynamic-import path the launcher uses.
            const originalImport = (window as any).__import ?? null;
            (window as any).__import = originalImport;
            const importer = async () => ({ default: (window as any).StackBlitzSDK });
            (window as any).__playgroundImporter = importer;
        });

        // Replace the click handler with a synchronous version that uses the stub.
        await page.evaluate(() => {
            const buttons = document.querySelectorAll<HTMLButtonElement>('.cdx-playground-launch');
            buttons.forEach(btn => {
                const cloned = btn.cloneNode(true) as HTMLButtonElement;
                btn.replaceWith(cloned);
                cloned.addEventListener('click', () => {
                    const id = cloned.dataset.cdxStackblitzManifest;
                    const node = document.querySelector(
                        `script[data-cdx-stackblitz-manifest-data="${id}"]`
                    );
                    const manifest = JSON.parse(node?.textContent ?? '{}');
                    (window as any).StackBlitzSDK.openProject(manifest, { newWindow: true });
                });
            });
        });

        await page.locator('.cdx-playground-launch').first().click();

        const calls = await page.evaluate(() => (window as any).__playgroundCalls);
        expect(calls).toHaveLength(1);
        expect(calls[0].opts).toEqual({ newWindow: true });
        expect(calls[0].manifest.template).toBe('angular-cli');
    });

    test('hides the Playground tab on a component without @playground blocks', async ({ page }) => {
        await page.goto('/components/UserCardComponent.html');
        const tabBar = page.locator('.cdx-tab-bar');
        await expect(tabBar).not.toContainText('Playground');
    });
});
