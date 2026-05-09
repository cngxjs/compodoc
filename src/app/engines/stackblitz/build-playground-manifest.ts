import { posix } from 'node:path';
import type { ComponentPlaygroundBlock } from '../../../templates/helpers/jsdoc';
import { STACKBLITZ_TEMPLATE } from './constants';
import { emitFileContent } from './format-files';
import {
    type DepGraphNode,
    type DepGraphResolver,
    type WalkOptions,
    walkDepGraph
} from './walk-dep-graph';

/**
 * The shape that ships in the per-block `<script type="application/json">`
 * payload and is consumed by `@stackblitz/sdk`'s `openProject({ newWindow: true })`.
 *
 * Stable contract — clients cache and replay manifests across page loads, so
 * adding optional fields is safe but renaming or removing fields is breaking.
 */
export interface PlaygroundManifest {
    title: string;
    description: string;
    template: typeof STACKBLITZ_TEMPLATE;
    /** POSIX-only file paths; values may be truncated by the file emitter. */
    files: { [posixPath: string]: string };
    /** Public Angular packages only — local source travels inline via `files`. */
    dependencies: { [pkg: string]: string };
}

/**
 * Minimal subset of the consumer's `package.json` the builder reads. Only
 * Angular peers participate in the manifest's `dependencies` map; everything
 * else is ignored at Stage 1.
 */
export interface ConsumerPackageJson {
    dependencies?: { [pkg: string]: string };
    peerDependencies?: { [pkg: string]: string };
}

export interface BuildOptions extends WalkOptions {
    /** Root path inside the StackBlitz workspace. POSIX. Defaults to `src/app/`. */
    sourceRoot?: string;
}

export type BuildResult = { ok: true; value: PlaygroundManifest } | { ok: false; error: string };

const DEFAULT_SOURCE_ROOT = 'src/app/';

const ANGULAR_FALLBACK = '*';

// Public Angular peers always present in the manifest's dependencies map.
// Each entry falls back to '*' when the consumer's package.json does not
// list it, so plain Angular snippets compile against whichever StackBlitz
// resolves at boot time.
const ANGULAR_PEERS = [
    '@angular/core',
    '@angular/common',
    '@angular/forms',
    '@angular/router',
    '@angular/animations',
    '@angular/platform-browser',
    '@angular/platform-browser-dynamic'
];

// Optional ecosystem peers — only forwarded into the manifest when the
// consumer's package.json actually declares them. Pure cngx demos must not
// drag Material into StackBlitz; conversely, a Material-extending component
// will not boot without these peers. The consumer package.json is the
// single source of truth.
const OPTIONAL_ANGULAR_PEERS = ['@angular/cdk', '@angular/material'];

const ESCAPE_SELECTOR = (selector: string): string => selector.replaceAll(/[^a-zA-Z0-9-]/g, '');

const fileNameForNode = (node: DepGraphNode, sourceRoot: string): string => {
    const base = posix.basename(node.file).replaceAll('\\', '/');
    return posix.join(sourceRoot, base);
};

const collectAngularDeps = (manifest?: ConsumerPackageJson): Record<string, string> => {
    const deps: Record<string, string> = {};
    const provided = {
        ...(manifest?.dependencies ?? {}),
        ...(manifest?.peerDependencies ?? {})
    };
    for (const peer of ANGULAR_PEERS) {
        deps[peer] = provided[peer] ?? ANGULAR_FALLBACK;
    }
    for (const peer of OPTIONAL_ANGULAR_PEERS) {
        if (provided[peer]) {
            deps[peer] = provided[peer];
        }
    }
    return deps;
};

const buildMainTs = (): string =>
    [
        "import 'zone.js';",
        "import { bootstrapApplication } from '@angular/platform-browser';",
        "import { DemoComponent } from './app/demo.component';",
        '',
        'bootstrapApplication(DemoComponent).catch(err => console.error(err));',
        ''
    ].join('\n');

const buildDemoComponentTs = (componentName: string, snippet: string, language: string): string => {
    const isTypescript = language === 'typescript' || language === 'javascript';
    const template = isTypescript
        ? `<pre><code>${snippet.replaceAll('`', '\\`')}</code></pre>`
        : snippet.replaceAll('`', '\\`');
    const importLine = isTypescript
        ? ''
        : `import { ${componentName} } from './${componentName}';\n`;
    const importsLine = isTypescript ? '' : `,\n    imports: [${componentName}]`;

    return [
        "import { Component } from '@angular/core';",
        importLine,
        '@Component({',
        "    selector: 'cdx-demo',",
        '    standalone: true,',
        `    template: \`${template}\`${importsLine}`,
        '})',
        'export class DemoComponent {}',
        ''
    ].join('\n');
};

const buildAngularJson = (): string =>
    JSON.stringify(
        {
            $schema: './node_modules/@angular/cli/lib/config/schema.json',
            version: 1,
            newProjectRoot: 'projects',
            projects: {
                demo: {
                    projectType: 'application',
                    root: '',
                    sourceRoot: 'src',
                    architect: {
                        build: {
                            builder: '@angular-devkit/build-angular:application',
                            options: {
                                browser: 'src/main.ts',
                                index: 'src/index.html',
                                tsConfig: 'tsconfig.json'
                            }
                        }
                    }
                }
            }
        },
        null,
        2
    );

const buildIndexHtml = (componentName: string): string =>
    [
        '<!doctype html>',
        '<html lang="en">',
        '<head><meta charset="utf-8"><title>compodocx playground</title></head>',
        `<body><cdx-demo></cdx-demo><!-- ${ESCAPE_SELECTOR(componentName)} --></body>`,
        '</html>',
        ''
    ].join('\n');

const buildTsconfig = (): string =>
    JSON.stringify(
        {
            compilerOptions: {
                target: 'ES2022',
                module: 'ES2022',
                moduleResolution: 'node',
                strict: true,
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
                useDefineForClassFields: false
            }
        },
        null,
        2
    );

/**
 * Pure builder. Result-typed (F14) — caller decides how to surface failure
 * (typically: render a static "project assembly failed" fallback and route
 * the message through `logger.warn`).
 */
export function buildPlaygroundManifest(
    componentName: string,
    block: ComponentPlaygroundBlock,
    resolve: DepGraphResolver,
    workspaceManifest?: ConsumerPackageJson,
    options: BuildOptions = {}
): BuildResult {
    const sourceRoot = (options.sourceRoot ?? DEFAULT_SOURCE_ROOT).replaceAll('\\', '/');

    const walk = walkDepGraph(componentName, resolve, options);
    if (!walk.ok) {
        return walk;
    }

    const files: Record<string, string> = {};
    files['src/main.ts'] = emitFileContent(buildMainTs());
    files['src/app/demo.component.ts'] = emitFileContent(
        buildDemoComponentTs(componentName, block.snippet, block.language)
    );
    files['src/index.html'] = emitFileContent(buildIndexHtml(componentName));
    files['angular.json'] = emitFileContent(buildAngularJson());
    files['tsconfig.json'] = emitFileContent(buildTsconfig());

    for (const node of walk.value) {
        const path = fileNameForNode(node, sourceRoot);
        files[path] = emitFileContent(node.sourceCode);
    }

    const dependencies = collectAngularDeps(workspaceManifest);

    return {
        ok: true,
        value: {
            title: block.title,
            description: `Runnable playground for ${componentName}: ${block.title}`,
            template: STACKBLITZ_TEMPLATE,
            files,
            dependencies
        }
    };
}
