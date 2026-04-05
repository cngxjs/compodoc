import { test, expect } from '@playwright/test';

test.describe('Coverage Report', () => {
    test.describe('Summary dashboard', () => {
        test('summary card is visible with donut and stats', async ({ page }) => {
            await page.goto('/coverage.html');

            const summary = page.locator('.cdx-coverage-summary');
            await expect(summary).toBeVisible();

            const donut = summary.locator('.cdx-coverage-donut');
            await expect(donut).toBeVisible();

            const stats = summary.locator('.cdx-coverage-stats');
            await expect(stats).toBeVisible();
        });

        test('donut SVG has accessible role and label', async ({ page }) => {
            await page.goto('/coverage.html');

            const donut = page.locator('.cdx-coverage-donut');
            await expect(donut).toHaveAttribute('role', 'img');

            const label = await donut.getAttribute('aria-label');
            expect(label).toContain('Documentation coverage');
        });

        test('stat values are numeric', async ({ page }) => {
            await page.goto('/coverage.html');

            const values = page.locator('.cdx-coverage-stat-value');
            const count = await values.count();
            expect(count).toBe(4);

            for (let i = 0; i < count; i++) {
                const text = await values.nth(i).textContent();
                expect(Number(text)).not.toBeNaN();
            }
        });

        test('stat labels show Total, Documented, Partial, Undocumented', async ({ page }) => {
            await page.goto('/coverage.html');

            const labels = page.locator('.cdx-coverage-stat-label');
            const texts = await labels.allTextContents();
            expect(texts).toContain('Total');
            expect(texts).toContain('Documented');
            expect(texts).toContain('Partial');
            expect(texts).toContain('Undocumented');
        });
    });

    test.describe('Grouped tables', () => {
        test('at least one coverage group is rendered', async ({ page }) => {
            await page.goto('/coverage.html');

            const groups = page.locator('.cdx-coverage-group');
            expect(await groups.count()).toBeGreaterThan(0);
        });

        test('group headers show entity badge', async ({ page }) => {
            await page.goto('/coverage.html');

            const header = page.locator('.cdx-coverage-group-header').first();
            const badge = header.locator('.cdx-badge');
            await expect(badge).toBeVisible();
        });

        test('group headers show fraction', async ({ page }) => {
            await page.goto('/coverage.html');

            const fraction = page.locator('.cdx-coverage-group-fraction').first();
            const text = await fraction.textContent();
            expect(text).toMatch(/\d+\/\d+/);
        });

        test('groups are collapsible with native details', async ({ page }) => {
            await page.goto('/coverage.html');

            const group = page.locator('.cdx-coverage-group').first();
            const table = group.locator('.cdx-coverage-table');

            // Initially open
            await expect(table).toBeVisible();

            // Click to collapse
            const header = group.locator('.cdx-coverage-group-header');
            await header.click();
            await expect(table).not.toBeVisible();

            // Click to expand
            await header.click();
            await expect(table).toBeVisible();
        });

        test('table rows link to entity pages', async ({ page }) => {
            await page.goto('/coverage.html');

            const link = page.locator('.cdx-coverage-table td a').first();
            const href = await link.getAttribute('href');
            expect(href).toMatch(/\.html/);
        });

        test('table rows show colored coverage percentage', async ({ page }) => {
            await page.goto('/coverage.html');

            const pct = page.locator('.cdx-coverage-pct').first();
            await expect(pct).toBeVisible();
            const text = await pct.textContent();
            expect(text).toMatch(/\d+%/);
        });
    });

    test.describe('No Bootstrap remnants', () => {
        test('no table.table-bordered.coverage remains', async ({ page }) => {
            await page.goto('/coverage.html');

            await expect(page.locator('table.coverage')).toHaveCount(0);
        });

        test('no tablesort script tags', async ({ page }) => {
            await page.goto('/coverage.html');

            const scripts = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('script[src]'))
                    .map(s => s.getAttribute('src'))
                    .filter(s => s && s.includes('tablesort'));
            });
            expect(scripts).toHaveLength(0);
        });
    });

    test.describe('Sorting', () => {
        test('clicking Name header sorts alphabetically', async ({ page }) => {
            await page.goto('/coverage.html');

            const group = page.locator('.cdx-coverage-group').first();
            const nameTh = group.locator('th[data-cdx-sort="name"]');

            // Click Name to sort ascending
            await nameTh.click();
            await expect(nameTh).toHaveAttribute('aria-sort', 'ascending');

            const rows = group.locator('tbody tr');
            const first = await rows.first().getAttribute('data-cdx-coverage-name');
            const last = await rows.last().getAttribute('data-cdx-coverage-name');
            expect(first!.localeCompare(last!)).toBeLessThanOrEqual(0);
        });

        test('clicking Name header again reverses sort', async ({ page }) => {
            await page.goto('/coverage.html');

            const group = page.locator('.cdx-coverage-group').first();
            const nameTh = group.locator('th[data-cdx-sort="name"]');

            await nameTh.click(); // ascending
            await nameTh.click(); // descending
            await expect(nameTh).toHaveAttribute('aria-sort', 'descending');

            const rows = group.locator('tbody tr');
            const first = await rows.first().getAttribute('data-cdx-coverage-name');
            const last = await rows.last().getAttribute('data-cdx-coverage-name');
            expect(first!.localeCompare(last!)).toBeGreaterThanOrEqual(0);
        });

        test('clicking Coverage header sorts by percentage', async ({ page }) => {
            await page.goto('/coverage.html');

            const group = page.locator('.cdx-coverage-group').first();
            const covTh = group.locator('th[data-cdx-sort="coverage"]');

            // Coverage starts as ascending — click to toggle to descending
            await covTh.click();
            await expect(covTh).toHaveAttribute('aria-sort', 'descending');

            const rows = group.locator('tbody tr');
            const firstPct = Number(await rows.first().getAttribute('data-cdx-coverage-pct'));
            const lastPct = Number(await rows.last().getAttribute('data-cdx-coverage-pct'));
            expect(firstPct).toBeGreaterThanOrEqual(lastPct);
        });

        test('sort resets other columns when clicking a new column', async ({ page }) => {
            await page.goto('/coverage.html');

            const group = page.locator('.cdx-coverage-group').first();
            const nameTh = group.locator('th[data-cdx-sort="name"]');
            const covTh = group.locator('th[data-cdx-sort="coverage"]');

            await nameTh.click();
            await expect(nameTh).toHaveAttribute('aria-sort', 'ascending');

            await covTh.click();
            await expect(nameTh).toHaveAttribute('aria-sort', 'none');
            // Coverage was reset to 'none' by Name click, so clicking it starts fresh as ascending
            await expect(covTh).toHaveAttribute('aria-sort', 'ascending');
        });
    });

    test.describe('Filter', () => {
        test('filter input is visible', async ({ page }) => {
            await page.goto('/coverage.html');

            const filter = page.locator('[data-cdx-coverage-filter]');
            await expect(filter).toBeVisible();
            await expect(filter).toHaveAttribute('aria-label');
        });

        test('typing filters rows across all groups', async ({ page }) => {
            await page.goto('/coverage.html');

            const totalBefore = await page.locator('.cdx-coverage-table tbody tr:not(.cdx-coverage-row--hidden)').count();

            const filter = page.locator('[data-cdx-coverage-filter]');
            await expect(filter).toBeVisible();

            // Use evaluate to set value and trigger input event directly
            await page.evaluate(() => {
                const input = document.querySelector<HTMLInputElement>('[data-cdx-coverage-filter]')!;
                input.value = 'aboutcomponent';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            await page.waitForTimeout(300);

            const totalAfter = await page.locator('.cdx-coverage-table tbody tr:not(.cdx-coverage-row--hidden)').count();
            expect(totalAfter).toBeLessThan(totalBefore);
            expect(totalAfter).toBeGreaterThan(0);
        });

        test('filter hides groups with no matching rows', async ({ page }) => {
            await page.goto('/coverage.html');

            const filter = page.locator('[data-cdx-coverage-filter]');
            await page.evaluate(() => {
                const input = document.querySelector<HTMLInputElement>('[data-cdx-coverage-filter]')!;
                input.value = 'aboutcomponent';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            await page.waitForTimeout(300);

            const hiddenGroups = await page.locator('.cdx-coverage-group--hidden').count();
            expect(hiddenGroups).toBeGreaterThan(0);
        });

        test('clearing filter shows all rows again', async ({ page }) => {
            await page.goto('/coverage.html');

            const filter = page.locator('[data-cdx-coverage-filter]');
            await page.evaluate(() => {
                const input = document.querySelector<HTMLInputElement>('[data-cdx-coverage-filter]')!;
                input.value = 'aboutcomponent';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            await page.waitForTimeout(300);

            const afterFilter = await page.locator('.cdx-coverage-table tbody tr:not(.cdx-coverage-row--hidden)').count();

            await page.evaluate(() => {
                const input = document.querySelector<HTMLInputElement>('[data-cdx-coverage-filter]')!;
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            await page.waitForTimeout(300);

            const afterClear = await page.locator('.cdx-coverage-table tbody tr:not(.cdx-coverage-row--hidden)').count();
            expect(afterClear).toBeGreaterThan(afterFilter);
        });

        test('no-results message shows when nothing matches', async ({ page }) => {
            await page.goto('/coverage.html');

            const filter = page.locator('[data-cdx-coverage-filter]');
            await page.evaluate(() => {
                const input = document.querySelector<HTMLInputElement>('[data-cdx-coverage-filter]')!;
                input.value = 'xyznonexistent';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            await page.waitForTimeout(300);

            const noResults = page.locator('.cdx-coverage-no-results--visible');
            await expect(noResults).toBeVisible();
        });

        test('Escape key clears the filter', async ({ page }) => {
            await page.goto('/coverage.html');

            const filter = page.locator('[data-cdx-coverage-filter]');
            await page.evaluate(() => {
                const input = document.querySelector<HTMLInputElement>('[data-cdx-coverage-filter]')!;
                input.value = 'aboutcomponent';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            await page.waitForTimeout(300);

            await filter.focus();
            await filter.press('Escape');
            await page.waitForTimeout(300);

            const value = await filter.inputValue();
            expect(value).toBe('');

            const hiddenGroups = await page.locator('.cdx-coverage-group--hidden').count();
            expect(hiddenGroups).toBe(0);
        });
    });

    test.describe('Responsive', () => {
        test('file column hidden at narrow viewport', async ({ page }) => {
            await page.setViewportSize({ width: 400, height: 800 });
            await page.goto('/coverage.html');

            const fileCol = page.locator('.cdx-coverage-file-col').first();
            // Container query hides file column below 500px content width
            const display = await fileCol.evaluate(
                el => getComputedStyle(el).display
            );
            expect(display).toBe('none');
        });
    });
});
