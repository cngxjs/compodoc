import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/src/**/*.spec.ts'],
        globals: true,
        testTimeout: 120000,
        hookTimeout: 120000,
        pool: 'forks',
        reporters: ['verbose'],
    },
});
