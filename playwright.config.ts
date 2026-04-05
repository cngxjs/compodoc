import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './test/playwright',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: process.env.CI ? 'github' : 'line',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:4000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',

        colorScheme: 'dark'
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            testIgnore: ['**/empty-states.spec.ts', '**/standalone-features.spec.ts', '**/entity-hero.spec.ts', '**/content-sections.spec.ts', '**/coverage-report.spec.ts', '**/miscellaneous-index.spec.ts'],
        },

        {
            name: 'chrome',
            use: { ...devices['Desktop Chrome'], channel: 'chrome' },
            testIgnore: ['**/empty-states.spec.ts', '**/standalone-features.spec.ts', '**/entity-hero.spec.ts', '**/content-sections.spec.ts', '**/coverage-report.spec.ts', '**/miscellaneous-index.spec.ts'],
        },

        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            testIgnore: ['**/empty-states.spec.ts', '**/standalone-features.spec.ts', '**/entity-hero.spec.ts', '**/content-sections.spec.ts', '**/coverage-report.spec.ts', '**/miscellaneous-index.spec.ts'],
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            testIgnore: ['**/empty-states.spec.ts', '**/standalone-features.spec.ts', '**/entity-hero.spec.ts', '**/content-sections.spec.ts', '**/coverage-report.spec.ts', '**/miscellaneous-index.spec.ts'],
        },

        {
            name: 'Microsoft Edge',
            use: { ...devices['Desktop Edge'], channel: 'msedge' },
            testIgnore: ['**/empty-states.spec.ts', '**/standalone-features.spec.ts', '**/entity-hero.spec.ts', '**/content-sections.spec.ts', '**/coverage-report.spec.ts', '**/miscellaneous-index.spec.ts'],
        },

        /* todomvc-ng2 fixture tests (empty states, etc.) — uses port 4001 */
        {
            name: 'todomvc',
            use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4001' },
            testMatch: ['**/empty-states.spec.ts', '**/entity-hero.spec.ts', '**/content-sections.spec.ts', '**/coverage-report.spec.ts', '**/miscellaneous-index.spec.ts'],
        },

        /* standalone-app fixture tests — uses port 4002 */
        {
            name: 'standalone',
            use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4002' },
            testMatch: ['**/standalone-features.spec.ts'],
        },
    ],

    /* Run local dev servers before starting the tests */
    webServer: [
        {
            command: 'npm run test:simple-doc',
            url: 'http://localhost:4000',
            reuseExistingServer: !process.env.CI,
        },
        {
            command: 'npm run test:todomvc-doc',
            url: 'http://localhost:4001',
            reuseExistingServer: !process.env.CI,
        },
        {
            command: 'npm run test:standalone-doc',
            url: 'http://localhost:4002',
            reuseExistingServer: !process.env.CI,
        },
    ]
});
