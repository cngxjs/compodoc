// NOTE: prepareDocumentation calls process.exit() eight times in the threshold
// cascade. This is legitimate CI-fail orchestration carried over verbatim from
// the legacy Application.prepareCoverage method (Sprint 3 finding S3-2 already
// established that orchestrator-level exit-code dispatch belongs here). A
// future sprint can rewrite this to return a Result that the orchestrator acts
// on; until then, the helper itself owns the exit semantics.

import { COMPODOC_DEFAULTS } from '../../utils/defaults';
import { logger } from '../../utils/logger';
import Configuration from '../configuration';
import FileEngine from '../engines/file.engine';
import HtmlEngine from '../engines/html.engine';
import { rejectGenerationPromise, resolveGenerationPromise } from '../generation-promise';
import type { CoverageData } from '../interfaces/coverageData.interface';
import {
    type CoverageFile,
    computeDocumentationCoverage,
    computeUnitTestCoverage
} from '../services/coverage';

export class CoveragePageGenerator {
    public prepareDocumentation(): Promise<any> {
        logger.info('Process documentation coverage report');

        return new Promise((resolve, _reject) => {
            const report = computeDocumentationCoverage({
                components: Configuration.mainData.components,
                directives: Configuration.mainData.directives,
                entities: Configuration.mainData.entities,
                classes: Configuration.mainData.classes,
                injectables: Configuration.mainData.injectables,
                interfaces: Configuration.mainData.interfaces,
                guards: Configuration.mainData.guards,
                interceptors: Configuration.mainData.interceptors,
                pipes: Configuration.mainData.pipes,
                miscellaneous: {
                    functions: Configuration.mainData.miscellaneous.functions,
                    variables: Configuration.mainData.miscellaneous.variables,
                    typealiases: Configuration.mainData.miscellaneous.typealiases
                }
            });

            const coverageData = {
                count: report.count,
                status: report.status,
                files: report.files
            };

            Configuration.addPage({
                name: 'coverage',
                id: 'coverage',
                context: 'coverage',
                files: coverageData.files,
                data: coverageData,
                depth: 0,
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });
            Configuration.mainData.coverageData = coverageData;
            if (Configuration.mainData.exportFormat === COMPODOC_DEFAULTS.exportFormat) {
                HtmlEngine.generateCoverageBadge(
                    Configuration.mainData.output,
                    'documentation',
                    coverageData
                );
            }

            const filesByPercent = [...coverageData.files].sort(
                (a, b) => a.coveragePercent - b.coveragePercent
            );
            const processCoveragePerFile = () => {
                logger.info('Process documentation coverage per file');
                logger.info('-------------------');

                const overFiles = filesByPercent.filter(f => {
                    const overTest =
                        f.coveragePercent >= Configuration.mainData.coverageMinimumPerFile;
                    if (overTest && !Configuration.mainData.coverageTestShowOnlyFailed) {
                        logger.info(
                            `${f.coveragePercent} % for file ${f.filePath} - ${f.name} - over minimum per file`
                        );
                    }
                    return overTest;
                });
                const underFiles = filesByPercent.filter(f => {
                    const underTest =
                        f.coveragePercent < Configuration.mainData.coverageMinimumPerFile;
                    if (underTest) {
                        logger.error(
                            `${f.coveragePercent} % for file ${f.filePath} - ${f.name} - under minimum per file`
                        );
                    }
                    return underTest;
                });

                logger.info('-------------------');
                return {
                    overFiles: overFiles,
                    underFiles: underFiles
                };
            };

            let coverageTestPerFileResults;
            if (
                Configuration.mainData.coverageTest &&
                !Configuration.mainData.coverageTestPerFile
            ) {
                // Global coverage test and not per file
                if (coverageData.count >= Configuration.mainData.coverageTestThreshold) {
                    logger.info(
                        `Documentation coverage (${coverageData.count}%) is over threshold (${Configuration.mainData.coverageTestThreshold}%)`
                    );
                    resolveGenerationPromise(true);
                    process.exit(0);
                } else {
                    const message = `Documentation coverage (${coverageData.count}%) is not over threshold (${Configuration.mainData.coverageTestThreshold}%)`;
                    rejectGenerationPromise();
                    if (Configuration.mainData.coverageTestThresholdFail) {
                        logger.error(message);
                        process.exit(1);
                    } else {
                        logger.warn(message);
                        process.exit(0);
                    }
                }
            } else if (
                !Configuration.mainData.coverageTest &&
                Configuration.mainData.coverageTestPerFile
            ) {
                coverageTestPerFileResults = processCoveragePerFile();
                // Per file coverage test and not global
                if (coverageTestPerFileResults.underFiles.length > 0) {
                    const message = `Documentation coverage per file is not over threshold (${Configuration.mainData.coverageMinimumPerFile}%)`;
                    rejectGenerationPromise();
                    if (Configuration.mainData.coverageTestThresholdFail) {
                        logger.error(message);
                        process.exit(1);
                    } else {
                        logger.warn(message);
                        process.exit(0);
                    }
                } else {
                    logger.info(
                        `Documentation coverage per file is over threshold (${Configuration.mainData.coverageMinimumPerFile}%)`
                    );
                    resolveGenerationPromise(true);
                    process.exit(0);
                }
            } else if (
                Configuration.mainData.coverageTest &&
                Configuration.mainData.coverageTestPerFile
            ) {
                // Per file coverage test and global
                coverageTestPerFileResults = processCoveragePerFile();
                if (
                    coverageData.count >= Configuration.mainData.coverageTestThreshold &&
                    coverageTestPerFileResults.underFiles.length === 0
                ) {
                    logger.info(
                        `Documentation coverage (${coverageData.count}%) is over threshold (${Configuration.mainData.coverageTestThreshold}%)`
                    );
                    logger.info(
                        `Documentation coverage per file is over threshold (${Configuration.mainData.coverageMinimumPerFile}%)`
                    );
                    resolveGenerationPromise(true);
                    process.exit(0);
                } else if (
                    coverageData.count >= Configuration.mainData.coverageTestThreshold &&
                    coverageTestPerFileResults.underFiles.length > 0
                ) {
                    logger.info(
                        `Documentation coverage (${coverageData.count}%) is over threshold (${Configuration.mainData.coverageTestThreshold}%)`
                    );
                    const message = `Documentation coverage per file is not over threshold (${Configuration.mainData.coverageMinimumPerFile}%)`;
                    rejectGenerationPromise();
                    if (Configuration.mainData.coverageTestThresholdFail) {
                        logger.error(message);
                        process.exit(1);
                    } else {
                        logger.warn(message);
                        process.exit(0);
                    }
                } else if (
                    coverageData.count < Configuration.mainData.coverageTestThreshold &&
                    coverageTestPerFileResults.underFiles.length > 0
                ) {
                    const messageGlobal = `Documentation coverage (${coverageData.count}%) is not over threshold (${Configuration.mainData.coverageTestThreshold}%)`,
                        messagePerFile = `Documentation coverage per file is not over threshold (${Configuration.mainData.coverageMinimumPerFile}%)`;
                    rejectGenerationPromise();
                    if (Configuration.mainData.coverageTestThresholdFail) {
                        logger.error(messageGlobal);
                        logger.error(messagePerFile);
                        process.exit(1);
                    } else {
                        logger.warn(messageGlobal);
                        logger.warn(messagePerFile);
                        process.exit(0);
                    }
                } else {
                    const message = `Documentation coverage (${coverageData.count}%) is not over threshold (${Configuration.mainData.coverageTestThreshold}%)`,
                        messagePerFile = `Documentation coverage per file is over threshold (${Configuration.mainData.coverageMinimumPerFile}%)`;
                    rejectGenerationPromise();
                    if (Configuration.mainData.coverageTestThresholdFail) {
                        logger.error(message);
                        logger.info(messagePerFile);
                        process.exit(1);
                    } else {
                        logger.warn(message);
                        logger.info(messagePerFile);
                        process.exit(0);
                    }
                }
            } else {
                resolve(true);
            }
        });
    }

    public prepareUnitTest(): Promise<any> {
        logger.info('Process unit test coverage report');
        return new Promise((resolve, _reject) => {
            const coverageData: CoverageData = Configuration.mainData.coverageData;
            const coverageFiles = coverageData.files as ReadonlyArray<CoverageFile> | undefined;
            if (!coverageFiles) {
                logger.warn('Missing documentation coverage data');
            }

            const fileDat = FileEngine.getSync(Configuration.mainData.unitTestCoverage);
            if (!fileDat) {
                return Promise.reject('Error reading unit test coverage file');
            }
            const unitTestSummary = JSON.parse(fileDat) as Record<string, unknown>;

            const report = computeUnitTestCoverage(unitTestSummary, coverageFiles);
            const unitTestData: Record<string, unknown> = {
                total: report.total,
                files: report.files,
                idColumn: report.idColumn
            };
            Configuration.mainData.unitTestData = unitTestData;
            Configuration.addPage({
                name: 'unit-test',
                id: 'unit-test',
                context: 'unit-test',
                files: report.files,
                data: unitTestData,
                depth: 0,
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });

            if (Configuration.mainData.exportFormat === COMPODOC_DEFAULTS.exportFormat) {
                const keysToGet = ['statements', 'branches', 'functions', 'lines'] as const;
                keysToGet.forEach(key => {
                    const metric = report.total[key];
                    if (metric) {
                        HtmlEngine.generateCoverageBadge(Configuration.mainData.output, key, {
                            count: metric.coveragePercent,
                            status: metric.status
                        });
                    }
                });
            }
            resolve(true);
        });
    }
}
