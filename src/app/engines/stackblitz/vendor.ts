import { posix } from 'node:path';

/**
 * Vendoring the locally built library into the StackBlitz file map.
 *
 * StackBlitz resolves registry `dependencies` against the last PUBLISHED
 * version, never the working tree — so a playground that imports an
 * unreleased symbol hard-fails in the sandbox. compodocx already inlines the
 * example sources into the project file map; vendoring is the same mechanism
 * one level deeper: read the locally built `dist/<pkg>` at docs-build time and
 * embed those files into the same payload, wiring each package as a local
 * `file:` dependency so the WebContainer's `npm install` resolves it (and its
 * inter-package deps) locally instead of from the registry.
 *
 * This module is the PURE half — directory walking and file reads come through
 * an injected {@link VendorFsReader}, mirroring `read-file-ref.ts`. The
 * page-generator wrapper plugs the real `fs`.
 */

/** One resolved vendor package, ready to embed into a manifest file map. */
export interface VendorPackage {
    /** Full npm package name (the value matched against a vendor pattern). */
    name: string;
    /** Files under the package dir, keyed by POSIX path relative to the dir. */
    files: Record<string, string>;
    /**
     * Names of OTHER vendored packages this one depends on — the closure
     * edges. Computed as `(dependencies ∪ peerDependencies) ∩ vendoredNames`,
     * so registry-only peers (`@angular/*`, `rxjs`, `tslib`) are excluded.
     */
    vendorDeps: string[];
    /** Sum of `files` content byte lengths — drives the payload size guard. */
    byteSize: number;
}

/**
 * Tiny FS abstraction kept local to the vendor resolver. `listFiles` returns
 * the recursive set of file paths under `dir` (POSIX-joined onto `dir`);
 * `readFile` returns `null` on miss rather than throwing.
 */
export interface VendorFsReader {
    exists(path: string): boolean;
    readFile(path: string): string | null;
    listFiles(dir: string): string[];
}

export interface VendorResolveResult {
    /** Resolved packages keyed by full package name. */
    packages: Record<string, VendorPackage>;
    /** Non-fatal notices (e.g. a glob that matched nothing). */
    warnings: string[];
    /** Fatal problems (missing root, an explicitly-named package absent). */
    errors: string[];
}

const toPosix = (p: string): string => p.replaceAll('\\', '/');

const isGlob = (pattern: string): boolean => pattern.includes('*');

/**
 * Match a package name against a vendor pattern. `*` matches any run of
 * characters (including `/`), so `@cngx/*` matches `@cngx/ui` and an exact
 * name matches only itself. Intentionally simple — vendor patterns are short
 * package globs, not full minimatch.
 */
const matchesPattern = (name: string, pattern: string): boolean => {
    if (!isGlob(pattern)) {
        return name === pattern;
    }
    const escaped = pattern.replaceAll(/[.+?^${}()|[\]\\]/g, String.raw`\$&`).replaceAll('*', '.*');
    return new RegExp(`^${escaped}$`).test(name);
};

const matchesAnyPattern = (name: string, patterns: string[]): boolean =>
    patterns.some(p => matchesPattern(name, p));

const depth = (dir: string): number => dir.split('/').length;

const isAncestorDir = (ancestor: string, dir: string): boolean =>
    dir === ancestor || dir.startsWith(`${ancestor}/`);

/**
 * Resolve the set of vendor packages available under `vendorRoot` that match
 * any of `patterns`. Primary package roots are detected by `package.json`
 * `name` (convention-free — works regardless of the dist directory layout);
 * secondary-entry-point `package.json`s nested inside a primary root are kept
 * as files but never treated as their own package. Pure apart from `fs`.
 */
export function resolveVendorPackages(
    patterns: string[],
    vendorRoot: string,
    fs: VendorFsReader
): VendorResolveResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const packages: Record<string, VendorPackage> = {};

    if (patterns.length === 0) {
        return { packages, warnings, errors };
    }

    const root = toPosix(vendorRoot);
    if (!fs.exists(root)) {
        errors.push(
            `playgroundVendor: vendor root "${vendorRoot}" not found — build the libraries before compodocx`
        );
        return { packages, warnings, errors };
    }

    const allFiles = fs.listFiles(root).map(toPosix);

    // Discover package roots by their package.json `name`. The shallowest dir
    // with a name wins; deeper ones nested inside it are secondary entry points.
    type RootInfo = { dir: string; name: string; deps: string[] };
    const candidates: RootInfo[] = [];
    for (const file of allFiles) {
        if (posix.basename(file) !== 'package.json' || file.includes('/node_modules/')) {
            continue;
        }
        const raw = fs.readFile(file);
        if (raw === null) {
            continue;
        }
        let parsed: {
            name?: unknown;
            dependencies?: unknown;
            peerDependencies?: unknown;
        };
        try {
            parsed = JSON.parse(raw);
        } catch {
            continue;
        }
        if (typeof parsed.name !== 'string' || parsed.name.length === 0) {
            continue;
        }
        const deps = {
            ...(typeof parsed.dependencies === 'object' && parsed.dependencies !== null
                ? (parsed.dependencies as Record<string, string>)
                : {}),
            ...(typeof parsed.peerDependencies === 'object' && parsed.peerDependencies !== null
                ? (parsed.peerDependencies as Record<string, string>)
                : {})
        };
        candidates.push({
            dir: posix.dirname(file),
            name: parsed.name,
            deps: Object.keys(deps)
        });
    }

    candidates.sort((a, b) => depth(a.dir) - depth(b.dir));
    const primaries: RootInfo[] = [];
    for (const cand of candidates) {
        if (!primaries.some(p => isAncestorDir(p.dir, cand.dir))) {
            primaries.push(cand);
        }
    }

    const matchedPrimaries = primaries.filter(p => matchesAnyPattern(p.name, patterns));
    const vendoredNames = new Set(matchedPrimaries.map(p => p.name));

    for (const primary of matchedPrimaries) {
        const files: Record<string, string> = {};
        let byteSize = 0;
        const prefix = `${primary.dir}/`;
        for (const file of allFiles) {
            if (!file.startsWith(prefix) || file.includes('/node_modules/')) {
                continue;
            }
            const content = fs.readFile(file);
            if (content === null) {
                continue;
            }
            const rel = file.slice(prefix.length);
            files[rel] = content;
            byteSize += content.length;
        }
        packages[primary.name] = {
            name: primary.name,
            files,
            vendorDeps: primary.deps.filter(d => vendoredNames.has(d)),
            byteSize
        };
    }

    // An explicitly-named (non-glob) package that didn't resolve is fatal:
    // the author asked for it by name and the build can't honour that.
    for (const pattern of patterns) {
        if (isGlob(pattern)) {
            if (!matchedPrimaries.some(p => matchesPattern(p.name, pattern))) {
                warnings.push(
                    `playgroundVendor: pattern "${pattern}" matched no package under ${vendorRoot}`
                );
            }
        } else if (!vendoredNames.has(pattern)) {
            errors.push(
                `playgroundVendor: "${pattern}" not found under ${vendorRoot} — run the library build before compodocx`
            );
        }
    }

    return { packages, warnings, errors };
}

/**
 * Walk the vendor dependency closure for one playground. Given the package
 * roots the playground's imports reference directly (`seeds`), follow each
 * vendored package's `vendorDeps` to collect the FULL set that must ship — so
 * vendoring `@cngx/ui` also vendors `@cngx/common`/`@cngx/core` rather than
 * pulling them stale from the registry. Pure graph traversal over the
 * in-memory package map. Seeds not present in `packages` are ignored.
 */
export function vendorClosure(
    seeds: Iterable<string>,
    packages: Record<string, VendorPackage>
): string[] {
    const visited = new Set<string>();
    const queue: string[] = [];
    for (const seed of seeds) {
        if (packages[seed]) {
            queue.push(seed);
        }
    }
    while (queue.length > 0) {
        const next = queue.shift();
        if (next === undefined || visited.has(next)) {
            continue;
        }
        visited.add(next);
        for (const dep of packages[next].vendorDeps) {
            if (!visited.has(dep) && packages[dep]) {
                queue.push(dep);
            }
        }
    }
    return Array.from(visited);
}
