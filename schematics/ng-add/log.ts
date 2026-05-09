import type { logging } from '@angular-devkit/core';
import type { MigrationResult } from './migrate';

export interface SummaryDetails {
    addedScriptCount: number;
    createdTsconfigDoc: boolean;
    scriptPrefix: string;
    projectName?: string;
}

export function logMigrationSummary(
    logger: logging.LoggerApi,
    migration: MigrationResult
): void {
    if (
        migration.removedDeps.length === 0 &&
        migration.renamedScripts.length === 0 &&
        migration.rewrittenScripts.length === 0
    ) {
        return;
    }

    logger.info('ng-add detected legacy compodoc artefacts:');

    for (const dep of migration.removedDeps) {
        logger.info(`  - removed dependency: ${dep}`);
    }

    for (const { from, to } of migration.renamedScripts) {
        logger.info(`  - renamed script: ${from} -> ${to}`);
    }

    if (migration.rewrittenScripts.length > 0) {
        const noun =
            migration.rewrittenScripts.length === 1 ? 'script invocation' : 'script invocations';
        logger.info(
            `  - rewrote ${migration.rewrittenScripts.length} ${noun} to use the new bin`
        );
    }
}

export function logInstallSummary(
    logger: logging.LoggerApi,
    details: SummaryDetails
): void {
    if (details.projectName) {
        logger.info(`  project scope: ${details.projectName}`);
    }
    logger.info(
        `  added ${details.addedScriptCount} ${details.scriptPrefix}:* scripts to package.json`
    );
    if (details.createdTsconfigDoc) {
        logger.info('  created tsconfig.doc.json');
    }
    logger.info('  scheduled npm install for @cngxjs/compodocx');
}
