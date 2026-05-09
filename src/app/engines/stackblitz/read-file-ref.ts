import { posix } from 'node:path';
import { extractBareSpecifiers } from './build-playground-manifest';
import { STACKBLITZ_FILE_COUNT_CAP } from './constants';
import { rewriteDecoratorUrls, rewriteRelativeImports } from './rewrite-imports';

/**
 * Tiny FS abstraction so the engine module stays I/O-free at its boundary.
 * Production wiring in `application.ts` plugs `readFileSync`/`existsSync`;
 * tests pass a static map. `readFile` returns `null` (not throw) on miss —
 * keeping the result type local to this module.
 */
export interface FsReader {
    readFile(path: string): string | null;
    exists(path: string): boolean;
}

/**
 * Outcome of reading a `@playground` file reference. The two modes share
 * one type so the manifest builder branches on `replacesAppComponent`.
 *
 * - HTML mode (`.html`):
 *   `htmlSnippet` carries the file body, `replacesAppComponent` is `false`,
 *   `files` is empty. The manifest builder rebuilds the inline-snippet path
 *   with `htmlSnippet` swapped in.
 *
 * - TS mode (`.ts`):
 *   `replacesAppComponent` is `true`, `files['src/app/app.component.ts']` is
 *   the rewritten entry source, and any decorator siblings + transitive
 *   relative imports are packed under flat `src/app/<basename>` paths.
 *   `bareSpecifiers` carries third-party package roots seen in any walked
 *   file so the manifest builder can auto-forward them.
 */
export interface FileRefBundle {
    /** POSIX-formatted resolved path of the entry file. */
    entry: string;
    /** Flat `src/app/<basename>` → contents. */
    files: Record<string, string>;
    /** Bare-specifier roots discovered across all walked files. */
    bareSpecifiers: Set<string>;
    /** `true` for `.ts` mode, `false` for `.html` mode. */
    replacesAppComponent: boolean;
    /** Set only when the file ref resolved to an `.html` file. */
    htmlSnippet?: string;
}

export type FileRefResult = { ok: true; value: FileRefBundle } | { ok: false; error: string };

const APP_COMPONENT_PATH = 'src/app/app.component.ts';
const APP_DIR = 'src/app';

const TEMPLATE_URL_RE = /templateUrl\s*:\s*['"]([^'"]+)['"]/;
const STYLE_URL_RE = /styleUrl\s*:\s*['"]([^'"]+)['"]/;
const STYLE_URLS_RE = /styleUrls\s*:\s*\[([^\]]+)\]/;
const STYLE_URLS_ITEM_RE = /['"]([^'"]+)['"]/g;
// Matches both `from '...'` (named/namespace imports + re-exports) and
// side-effect `import '...'`. The `from` form covers `import { X } from '..'`,
// `import X from '..'`, `import * as N from '..'`, and `export ... from '..'`;
// the bare `import` form covers `import './polyfill';`.
const RELATIVE_IMPORT_FROM_RE = /(?:\bfrom\b|\bimport\b)\s+['"](\.\.?\/[^'"]+)['"]/g;

const toPosix = (p: string): string => p.replaceAll('\\', '/');

const flatPath = (resolved: string): string => `${APP_DIR}/${posix.basename(resolved)}`;

/**
 * Resolve a `@playground` file reference and (for `.ts` mode) walk its
 * decorator siblings + transitive relative imports into a flat bundle. Pure
 * apart from the injected `FsReader` — easy to unit-test against a static map.
 *
 * Result.err on:
 *  - unsupported extension (anything other than `.html` or `.ts`)
 *  - missing entry file
 *  - missing `templateUrl` / `styleUrl` / `styleUrls` sibling
 *  - relative-import target that the FS reader cannot find
 *  - file walk that exceeds `maxFiles` (defaults to STACKBLITZ_FILE_COUNT_CAP)
 */
export function readFileRef(
    fileRef: string,
    hostFile: string,
    fs: FsReader,
    options: { maxFiles?: number } = {}
): FileRefResult {
    const maxFiles = options.maxFiles ?? STACKBLITZ_FILE_COUNT_CAP;
    const hostDir = posix.dirname(toPosix(hostFile));
    const entryPath = posix.normalize(posix.join(hostDir, fileRef));

    const ext = posix.extname(entryPath);
    if (ext !== '.html' && ext !== '.ts') {
        return {
            ok: false,
            error: `Playground fileRef must end in .html or .ts: ${fileRef}`
        };
    }

    const entryContent = fs.readFile(entryPath);
    if (entryContent === null) {
        return { ok: false, error: `Cannot find playground file: ${fileRef}` };
    }

    if (ext === '.html') {
        return {
            ok: true,
            value: {
                entry: entryPath,
                files: {},
                bareSpecifiers: new Set(),
                replacesAppComponent: false,
                htmlSnippet: entryContent
            }
        };
    }

    return readTsFileRef(entryPath, entryContent, fs, maxFiles);
}

const readTsFileRef = (
    entryPath: string,
    entryContent: string,
    fs: FsReader,
    maxFiles: number
): FileRefResult => {
    const files: Record<string, string> = {};
    const bareSpecifiers = new Set<string>();
    const entryDir = posix.dirname(entryPath);

    // Decorator siblings — templateUrl / styleUrl / styleUrls.
    const tplMatch = entryContent.match(TEMPLATE_URL_RE);
    if (tplMatch) {
        const sibling = readSibling(entryDir, tplMatch[1], 'templateUrl', fs);
        if (!sibling.ok) {
            return sibling;
        }
        files[flatPath(sibling.value.path)] = sibling.value.content;
    }
    const styleUrlMatch = entryContent.match(STYLE_URL_RE);
    if (styleUrlMatch) {
        const sibling = readSibling(entryDir, styleUrlMatch[1], 'styleUrl', fs);
        if (!sibling.ok) {
            return sibling;
        }
        files[flatPath(sibling.value.path)] = sibling.value.content;
    }
    const styleUrlsMatch = entryContent.match(STYLE_URLS_RE);
    if (styleUrlsMatch) {
        STYLE_URLS_ITEM_RE.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = STYLE_URLS_ITEM_RE.exec(styleUrlsMatch[1])) !== null) {
            const sibling = readSibling(entryDir, m[1], 'styleUrls', fs);
            if (!sibling.ok) {
                return sibling;
            }
            files[flatPath(sibling.value.path)] = sibling.value.content;
        }
    }

    // Pack the entry as app.component.ts. Both transforms run — relative
    // imports flatten to './basename', decorator urls flatten to './basename'.
    // Then append an `AppComponent` alias so `src/main.ts`'s
    // `import { AppComponent } from './app/app.component'` resolves regardless
    // of the entry's actual class name (e.g. `FullComponentExample`).
    const rewritten = rewriteDecoratorUrls(rewriteRelativeImports(entryContent));
    files[APP_COMPONENT_PATH] = appendAppComponentAlias(rewritten);
    for (const spec of extractBareSpecifiers(entryContent)) {
        bareSpecifiers.add(spec);
    }

    // BFS walk of relative imports. Entry counts as collected file #1.
    const visited = new Set<string>([entryPath]);
    const queue: string[] = [];
    enqueueRelativeImports(entryContent, entryDir, visited, queue);

    let collectedCount = 1;
    while (queue.length > 0) {
        const next = queue.shift();
        if (next === undefined) {
            break;
        }
        const content = fs.readFile(next);
        if (content === null) {
            return { ok: false, error: `Cannot find imported file: ${next}` };
        }
        collectedCount++;
        if (collectedCount > maxFiles) {
            return {
                ok: false,
                error: `Playground file walk exceeded ${maxFiles} files`
            };
        }
        files[flatPath(next)] = rewriteRelativeImports(content);
        for (const spec of extractBareSpecifiers(content)) {
            bareSpecifiers.add(spec);
        }
        enqueueRelativeImports(content, posix.dirname(next), visited, queue);
    }

    return {
        ok: true,
        value: {
            entry: entryPath,
            files,
            bareSpecifiers,
            replacesAppComponent: true
        }
    };
};

type SiblingResult =
    | { ok: true; value: { path: string; content: string } }
    | { ok: false; error: string };

const readSibling = (
    entryDir: string,
    rawPath: string,
    label: string,
    fs: FsReader
): SiblingResult => {
    const resolved = posix.normalize(posix.join(entryDir, rawPath));
    const content = fs.readFile(resolved);
    if (content === null) {
        return {
            ok: false,
            error: `Cannot find ${label} sibling: ${rawPath} (resolved ${resolved})`
        };
    }
    return { ok: true, value: { path: resolved, content } };
};

/**
 * The scaffold's `src/main.ts` does `import { AppComponent } from './app/app.component'`,
 * so a TS-mode entry whose class is named anything other than `AppComponent`
 * (e.g. `FullComponentExample`, `LibraryButtonExample`) breaks the build with
 * `TS2305: Module ... has no exported member 'AppComponent'`. Append an alias
 * `export { OriginalName as AppComponent };` after the original source so the
 * import resolves regardless of the entry's class name. If the entry already
 * exports an `AppComponent` (or no top-level exported class can be found),
 * leave the source untouched.
 */
const TOP_EXPORTED_CLASS_RE = /^export\s+class\s+([A-Za-z_$][\w$]*)/m;

const appendAppComponentAlias = (source: string): string => {
    if (/\bexport\s+class\s+AppComponent\b/.test(source)) {
        return source;
    }
    if (/\bexport\s*\{\s*[^}]*\bas\s+AppComponent\b[^}]*\}/.test(source)) {
        return source;
    }
    const match = source.match(TOP_EXPORTED_CLASS_RE);
    if (!match) {
        return source;
    }
    const className = match[1];
    const trailingNewline = source.endsWith('\n') ? '' : '\n';
    return `${source}${trailingNewline}export { ${className} as AppComponent };\n`;
};

/**
 * Append `.ts` unless the path already ends in a known TS-resolvable
 * extension. `posix.extname` is unreliable here because filenames like
 * `button.component` would report `.component` as the extension.
 */
const resolveTsImport = (raw: string): string => {
    if (raw.endsWith('.ts') || raw.endsWith('.tsx') || raw.endsWith('.js')) {
        return raw;
    }
    return `${raw}.ts`;
};

const enqueueRelativeImports = (
    source: string,
    fromDir: string,
    visited: Set<string>,
    queue: string[]
): void => {
    RELATIVE_IMPORT_FROM_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RELATIVE_IMPORT_FROM_RE.exec(source)) !== null) {
        const resolved = resolveTsImport(posix.normalize(posix.join(fromDir, m[1])));
        if (!visited.has(resolved)) {
            visited.add(resolved);
            queue.push(resolved);
        }
    }
};
