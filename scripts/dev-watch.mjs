#!/usr/bin/env node
/**
 * Dev watcher for compodocx.
 *
 * Watches source files and rebuilds the minimal pipeline required to see
 * the change reflected in a fixture's generated docs.
 *
 * Pipelines:
 *   - CSS          src/styles/**        → build:css          → regenerate fixture
 *   - Client JS    src/client/**        → build:client       → regenerate fixture
 *   - Templates    src/templates/**     → rollup (index-cli) → regenerate fixture
 *   - Core/app     src/app/**           → rollup (index-cli) → regenerate fixture
 *   - Helpers      src/utils/**         → rollup (index-cli) → regenerate fixture
 *
 * Usage:
 *   node scripts/dev-watch.mjs [--fixture=kitchen-sink-standalone] [--out=/tmp/…-docs] [--port=8081] [--no-reload]
 *
 * On first run the script performs a full cold build, generates the fixture
 * once, and starts sirv-cli as a child process. Subsequent file changes
 * trigger only the affected pipeline + a fixture regenerate.
 *
 * Auto-reload: a tiny SSE server runs on port+1000 (default 9081). Each
 * generated HTML file gets a `<script data-cdx-dev-reload>` injected that
 * opens an EventSource; after every rebuild the watcher broadcasts a
 * `reload` message and the browser reloads itself. Disable with --no-reload.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---------- args ----------
const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
        const [k, v] = a.replace(/^--/, '').split('=');
        return [k, v ?? true];
    })
);
const fixture = args.fixture ?? 'kitchen-sink-standalone';
const outDir = args.out ?? `/tmp/${fixture}-docs`;
const port = args.port ?? '8081';
const reloadPort = Number(port) + 1000;
const reloadEnabled = args.reload !== 'false' && args['no-reload'] !== true;
const fixtureTsconfig = `test/fixtures/${fixture}/tsconfig.json`;

if (!existsSync(resolve(root, fixtureTsconfig))) {
    console.error(`[dev] fixture tsconfig not found: ${fixtureTsconfig}`);
    process.exit(1);
}

// ---------- ansi ----------
const c = {
    dim: s => `\x1b[2m${s}\x1b[0m`,
    cyan: s => `\x1b[36m${s}\x1b[0m`,
    green: s => `\x1b[32m${s}\x1b[0m`,
    yellow: s => `\x1b[33m${s}\x1b[0m`,
    red: s => `\x1b[31m${s}\x1b[0m`,
    bold: s => `\x1b[1m${s}\x1b[0m`
};
const now = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
const log = (tag, msg) => console.log(`${c.dim(`[${now()}]`)} ${tag} ${msg}`);

// ---------- run helper ----------
const run = (cmd, args, label) =>
    new Promise((resolvePromise, rejectPromise) => {
        const start = Date.now();
        const child = spawn(cmd, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
        let stderrBuf = '';
        child.stderr.on('data', d => {
            stderrBuf += d.toString();
        });
        child.stdout.on('data', () => {});
        child.on('close', code => {
            const ms = Date.now() - start;
            if (code === 0) {
                log(c.green(`[${label}]`), c.dim(`done in ${ms}ms`));
                resolvePromise();
            } else {
                log(c.red(`[${label}]`), c.red(`failed (exit ${code})`));
                if (stderrBuf.trim()) {
                    console.error(stderrBuf.trim().split('\n').slice(-20).join('\n'));
                }
                rejectPromise(new Error(`${label} failed`));
            }
        });
    });

// ---------- build steps ----------
const buildCss = () =>
    run('npx', ['tailwindcss', '-i', 'src/styles/compodocx.css', '-o', 'src/resources/styles/compodocx.css', '--minify'], 'css');

const buildClient = () =>
    run(
        'npx',
        [
            'esbuild',
            'src/client/compodocx.ts',
            '--bundle',
            '--minify',
            '--splitting',
            '--format=esm',
            '--outdir=src/resources/js',
            '--target=es2020',
            '--entry-names=[name]',
            '--chunk-names=chunks/[name]-[hash]'
        ],
        'client'
    );

const buildRollup = () =>
    run('npx', ['rollup', '-c', 'rollup/rollup.config.mjs', '--bundleConfigAsCjs'], 'rollup');

const generateFixture = () => {
    if (existsSync(outDir)) {
        rmSync(outDir, { recursive: true, force: true });
    }
    return run(
        './bin/index-cli.js',
        ['-p', fixtureTsconfig, '-d', outDir, '--disableSearch'],
        'docs'
    );
};

// ---------- live reload via SSE ----------
const sseClients = new Set();
let reloadServer = null;

const startReloadServer = () => {
    reloadServer = createServer((req, res) => {
        if (req.url !== '/reload') {
            res.writeHead(404);
            res.end();
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        res.write('retry: 500\n\n');
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));
    });
    reloadServer.listen(reloadPort);
};

const broadcastReload = () => {
    for (const client of sseClients) {
        try {
            client.write('data: reload\n\n');
        } catch {
            sseClients.delete(client);
        }
    }
};

const RELOAD_MARKER = 'data-cdx-dev-reload';
const reloadSnippet = `<script ${RELOAD_MARKER}>(function(){try{var es=new EventSource('http://localhost:${reloadPort}/reload');es.onmessage=function(){location.reload();};es.onerror=function(){};}catch(e){}})();</script>`;

const walkHtml = (dir, out = []) => {
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        const st = statSync(p);
        if (st.isDirectory()) {
            walkHtml(p, out);
        } else if (entry.endsWith('.html')) {
            out.push(p);
        }
    }
    return out;
};

const injectReloadScript = () => {
    if (!reloadEnabled || !existsSync(outDir)) {
        return;
    }
    const files = walkHtml(outDir);
    let count = 0;
    for (const file of files) {
        const html = readFileSync(file, 'utf8');
        if (html.includes(RELOAD_MARKER)) {
            continue;
        }
        if (!html.includes('</body>')) {
            continue;
        }
        writeFileSync(file, html.replace('</body>', `${reloadSnippet}</body>`));
        count += 1;
    }
    log(c.cyan('[reload]'), c.dim(`injected into ${count} files`));
};

// ---------- debounced pipelines ----------
let queue = new Set();
let pending = false;
let running = false;

const schedule = (step) => {
    queue.add(step);
    if (pending || running) {
        return;
    }
    pending = true;
    setTimeout(flush, 80);
};

const flush = async () => {
    pending = false;
    if (running) {
        return;
    }
    running = true;
    const steps = new Set(queue);
    queue = new Set();

    try {
        // run independent steps in parallel, then docs
        const tasks = [];
        if (steps.has('css')) {
            tasks.push(buildCss());
        }
        if (steps.has('client')) {
            tasks.push(buildClient());
        }
        if (steps.has('rollup')) {
            tasks.push(buildRollup());
        }
        if (tasks.length > 0) {
            await Promise.all(tasks);
        }
        await generateFixture();
        injectReloadScript();
        broadcastReload();
        log(c.cyan('[ready]'), c.bold(`http://localhost:${port}`));
    } catch (err) {
        log(c.red('[error]'), err.message);
    } finally {
        running = false;
        if (queue.size > 0) {
            pending = true;
            setTimeout(flush, 80);
        }
    }
};

// ---------- cold build ----------
console.log(c.bold(c.cyan('\n  compodocx dev watch\n')));
console.log(`  fixture : ${c.yellow(fixture)}`);
console.log(`  out     : ${c.yellow(outDir)}`);
console.log(`  port    : ${c.yellow(port)}`);
console.log(`  reload  : ${c.yellow(reloadEnabled ? `on (:${reloadPort})` : 'off')}\n`);

log(c.cyan('[cold]'), 'running full build...');
try {
    await buildRollup();
    await Promise.all([buildClient(), buildCss()]);
    await generateFixture();
    if (reloadEnabled) {
        startReloadServer();
        log(c.cyan('[reload]'), `SSE on :${reloadPort}`);
        injectReloadScript();
    }
} catch (err) {
    console.error(c.red('[cold] build failed — aborting'));
    console.error(err);
    process.exit(1);
}

// ---------- sirv server ----------
log(c.cyan('[serve]'), `sirv-cli on :${port}`);
const sirv = spawn(
    'npx',
    [
        'sirv-cli',
        outDir,
        '--port',
        String(port),
        '--single',
        '--host',
        '0.0.0.0',
        '--dev', // disables caching (max-age 0, no etag) — required for CSS hot reload
        '--quiet'
    ],
    { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] }
);

// ---------- watchers ----------
// chokidar v4+ dropped glob support — watch directories and filter by extension
const watch = (paths, exts, step, label) => {
    const extSet = new Set(exts);
    const watcher = chokidar.watch(paths, {
        cwd: root,
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 20 },
        ignored: (path, stats) => {
            if (!stats) {
                return false;
            }
            if (stats.isDirectory()) {
                return false;
            }
            const dot = path.lastIndexOf('.');
            if (dot === -1) {
                return true;
            }
            return !extSet.has(path.slice(dot));
        }
    });
    watcher.on('all', (evt, path) => {
        log(c.yellow(`[${label}]`), `${evt} ${c.dim(path)}`);
        schedule(step);
    });
};

watch(['src/styles'], ['.css'], 'css', 'css');
watch(['src/client'], ['.ts'], 'client', 'client');
watch(
    ['src/app', 'src/templates', 'src/utils', 'src/index.ts', 'src/index-cli.ts'],
    ['.ts', '.tsx'],
    'rollup',
    'rollup'
);

console.log(c.green(`\n  ready — http://localhost:${port}\n`));

// ---------- cleanup ----------
const shutdown = () => {
    log(c.cyan('[exit]'), 'stopping...');
    sirv.kill('SIGTERM');
    if (reloadServer) {
        reloadServer.close();
        for (const client of sseClients) {
            client.end();
        }
    }
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
