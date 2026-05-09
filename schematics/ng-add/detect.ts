import {
    LEGACY_BIN_PATTERN,
    LEGACY_PACKAGE_NAME,
    LEGACY_SCRIPT_KEY_PREFIX
} from './constants';

export interface PackageJsonLike {
    dependencies?: { [key: string]: string };
    devDependencies?: { [key: string]: string };
    scripts?: { [key: string]: string };
    [other: string]: unknown;
}

export interface LegacyFinding {
    /** True if `@compodoc/compodoc` is listed in `dependencies` or `devDependencies`. */
    hasCompodocDep: boolean;
    /** Script keys whose name begins with `compodoc:` (excludes `compodocx:` keys). */
    legacyScriptKeys: string[];
    /** Script keys whose value invokes the legacy `compodoc` bin (excludes `compodocx`). */
    legacyScriptInvocations: string[];
    /** True if `tsconfig.doc.json` already exists at the resolved location. */
    hasTsconfigDoc: boolean;
}

function depsContain(deps: { [key: string]: string } | undefined, name: string): boolean {
    return !!deps && Object.prototype.hasOwnProperty.call(deps, name);
}

function isLegacyScriptKey(key: string): boolean {
    return key.startsWith(LEGACY_SCRIPT_KEY_PREFIX);
}

function valueInvokesLegacyBin(value: string): boolean {
    LEGACY_BIN_PATTERN.lastIndex = 0;
    return LEGACY_BIN_PATTERN.test(value);
}

export function detectLegacyArtefacts(
    packageJson: PackageJsonLike,
    hasTsconfigDoc: boolean
): LegacyFinding {
    const hasCompodocDep =
        depsContain(packageJson.dependencies, LEGACY_PACKAGE_NAME) ||
        depsContain(packageJson.devDependencies, LEGACY_PACKAGE_NAME);

    const scripts = packageJson.scripts ?? {};
    const legacyScriptKeys: string[] = [];
    const legacyScriptInvocations: string[] = [];

    for (const [key, value] of Object.entries(scripts)) {
        if (isLegacyScriptKey(key)) {
            legacyScriptKeys.push(key);
        }
        if (typeof value === 'string' && valueInvokesLegacyBin(value)) {
            legacyScriptInvocations.push(key);
        }
    }

    return {
        hasCompodocDep,
        legacyScriptKeys,
        legacyScriptInvocations,
        hasTsconfigDoc
    };
}

export function hasAnyLegacy(finding: LegacyFinding): boolean {
    return (
        finding.hasCompodocDep ||
        finding.legacyScriptKeys.length > 0 ||
        finding.legacyScriptInvocations.length > 0
    );
}
