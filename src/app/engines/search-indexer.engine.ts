import { execSync } from 'child_process';
import * as path from 'path';

import { logger } from '../../utils/logger';

/**
 * Run Pagefind to index the generated documentation.
 * Pagefind scans static HTML files and creates a search index.
 * Must be called AFTER all HTML files and resources are written to the output directory.
 */
export function runPagefindIndex(outputFolder: string): void {
    const resolved = path.resolve(outputFolder);
    logger.info('Indexing search with Pagefind');

    try {
        execSync(
            `npx pagefind --site "${resolved}" --output-subdir pagefind`,
            { stdio: 'pipe', timeout: 60_000 }
        );
        logger.info('Search index generated');
    } catch (err) {
        logger.error('Pagefind indexing failed', (err as Error).message);
    }
}
