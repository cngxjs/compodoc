import { defineConfig } from 'tsdown';

// Browser bundle for the client-side runtime: search, command palette, code
// blocks, graphs, hash router, sidebar, theme switcher, etc. ESM-only,
// minified, targets ES2020. Output goes to src/resources/js/, which also
// holds the legacy `libs/` directory; the Tailwind CSS output sits one level
// up. `clean: false` is required, otherwise tsdown wipes both on rebuild.
//
// D3 is dynamic-imported from `src/client/graphs.ts:27` and ends up as a
// separate chunk under chunks/, lazy-loaded only on pages that render a
// module graph. Pagefind uses a runtime-URL form, `await import(new URL(...))`
// at command-palette.ts:210. Bundlers can't follow runtime-string imports,
// so Pagefind isn't bundled here at all; it's fetched from the user's
// deployed site at runtime (Pagefind generates its own bundle during indexing).
export default defineConfig({
    entry: { compodocx: 'src/client/compodocx.ts' },
    format: ['esm'],
    outDir: 'src/resources/js',
    target: 'es2020',
    minify: true,
    sourcemap: false,
    clean: false,
    dts: false,
    platform: 'browser',
    outputOptions: {
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: '[name].js',
    },
    // The browser bundle has no node_modules at runtime, so tsdown has to
    // inline every static and dynamic import. Without this override, tsdown
    // auto-externalizes entries in `dependencies` by default, which would
    // leave `await import('d3')` as a bare specifier the browser can't
    // resolve. Pagefind is a runtime-URL dynamic import (bundlers can't
    // follow it), so this option doesn't apply to it.
    deps: {
        alwaysBundle: [/.*/],
    },
});
