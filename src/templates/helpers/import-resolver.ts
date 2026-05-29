import Configuration from '../../app/configuration';

/**
 * Resolve the package import path for an entity based on its source file
 * and the tsconfig path aliases.
 *
 * Returns e.g. `@cngx/common/card` for an entity in `src/common/card/src/card.component.ts`,
 * or `''` when no matching path alias is found.
 */
export const resolveImportPath = (entityFile: string): string => {
    const paths: Record<string, string[]> = Configuration.mainData.tsconfigPaths ?? {};
    const baseUrl: string = Configuration.mainData.tsconfigBaseUrl ?? '';

    if (!entityFile || Object.keys(paths).length === 0) {
        return '';
    }

    // Normalize: strip leading ./ and trailing filename to get the directory.
    // Prepend `/` so substring matches work whether the source path is
    // absolute-style (`/abs/.../projects/ui/feedback/...`) or project-relative
    // (`projects/ui/feedback/...`).
    const normalizedFile = entityFile.replace(/\\/g, '/');
    const lookup = normalizedFile.startsWith('/') ? normalizedFile : `/${normalizedFile}`;

    let bestMatch = '';
    let bestAlias = '';

    for (const [alias, targets] of Object.entries(paths)) {
        for (const target of targets) {
            // Strip trailing filename (public-api.ts, index.ts, *)
            const dir = target
                .replace(/\\/g, '/')
                .replace(/\/\*$/, '')
                .replace(/\/[^/]+\.ts$/, '');

            const fullDir = baseUrl && baseUrl !== '.' ? `${baseUrl}/${dir}` : dir;

            if (lookup.includes(`/${fullDir}/`) || lookup.endsWith(`/${fullDir}`)) {
                // Prefer longer (more specific) matches
                if (fullDir.length > bestMatch.length) {
                    bestMatch = fullDir;
                    bestAlias = alias.replace(/\/\*$/, '');
                }
            }
        }
    }

    return bestAlias;
};
