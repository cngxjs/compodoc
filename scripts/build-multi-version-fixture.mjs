#!/usr/bin/env node
/**
 * Build two version snapshots of the sample-files fixture into
 * /tmp/compodoc-multi-version and then serve the parent folder so the
 * Playwright multi-version project can exercise navigation between
 * the two builds.
 *
 * v1.0.0 builds from `tsconfig.entry.json` (a smaller subset that does
 * NOT include Bar.html). v2.0.0 builds from `tsconfig.simple.json`
 * (full file set, includes Bar.html). The page-not-in-old-version
 * fallback path of the switcher widget is exercised by clicking
 * v1.0.0 from `/v2.0.0/components/BarComponent.html`.
 */

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const OUT = '/tmp/compodoc-multi-version';
const PORT = '4003';
const CLI = './bin/index-cli.js';

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const TOGGLE = 'modules,components,directives,classes,injectables,interceptors,guards,pipes,interfaces,miscellaneous';

const buildV1 = spawnSync(
    'node',
    [
        CLI,
        '-p',
        './test/fixtures/sample-files/tsconfig.entry.json',
        '-d',
        OUT,
        '--versionLabel',
        'v1.0.0',
        '--disableSearch',
        '--toggleMenuItems',
        TOGGLE
    ],
    { stdio: 'inherit' }
);
if (buildV1.status !== 0) {
    process.exit(buildV1.status ?? 1);
}

const buildV2 = spawnSync(
    'node',
    [
        CLI,
        '-p',
        './test/fixtures/sample-files/tsconfig.simple.json',
        '-d',
        OUT,
        '--versionLabel',
        'v2.0.0',
        '--disableSearch',
        '--toggleMenuItems',
        TOGGLE
    ],
    { stdio: 'inherit' }
);
if (buildV2.status !== 0) {
    process.exit(buildV2.status ?? 1);
}

// Serve the parent (no -p, only -d + -s) — the CLI uses sirv on the folder
// and the manifest + version subdirs are reachable side-by-side.
const serve = spawn(
    'node',
    [CLI, '-d', OUT, '-s', '--port', PORT, '--no-multiVersion'],
    { stdio: 'inherit' }
);
serve.on('exit', code => process.exit(code ?? 0));
