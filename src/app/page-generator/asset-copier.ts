import * as path from 'node:path';
import * as fs from 'fs-extra';

import { logger } from '../../utils/logger';
import Configuration from '../configuration';
import FileEngine from '../engines/file.engine';
import { runPagefindIndex } from '../engines/search-indexer.engine';
import { updateVersionsManifest } from '../engines/versions-manifest.engine';
import { resolveGenerationPromise } from '../generation-promise';

const cwd = process.cwd();

export interface AssetCopierCallbacks {
    onServe: (folder: string) => void;
    onDone: () => void;
    getElapsedTime: () => number;
}

export class AssetCopier {
    constructor(private readonly callbacks: AssetCopierCallbacks) {}

    public processAssetsFolder(): void {
        logger.info('Copy assets folder');

        if (!FileEngine.existsSync(Configuration.mainData.assetsFolder)) {
            logger.error(
                `Provided assets folder ${Configuration.mainData.assetsFolder} did not exist`
            );
        } else {
            let finalOutput = Configuration.mainData.output;

            const testOutputDir = Configuration.mainData.output.match(cwd);

            if (testOutputDir && testOutputDir.length > 0) {
                finalOutput = Configuration.mainData.output.replace(cwd + path.sep, '');
            }

            const destination = path.join(
                finalOutput,
                path.basename(Configuration.mainData.assetsFolder)
            );
            fs.copy(
                path.resolve(Configuration.mainData.assetsFolder),
                path.resolve(destination),
                err => {
                    if (err) {
                        logger.error('Error during resources copy ', err);
                    }
                }
            );
        }
    }

    public processResources(): void {
        logger.info('Copy main resources');

        const onComplete = () => {
            // Run Pagefind search indexing after all HTML files are written
            if (!Configuration.mainData.disableSearch) {
                runPagefindIndex(Configuration.mainData.output);
            }

            // Multi-version: append/update this version's entry in
            // <versionsRoot>/versions.json. Runs after Pagefind so an
            // indexing failure doesn't leave a stale manifest behind. The
            // manifest stores a URL-relative path with a trailing slash
            // (the switcher widget concatenates it with the per-page tail).
            if (Configuration.mainData.multiVersion && Configuration.mainData.versionsRoot) {
                try {
                    updateVersionsManifest({
                        versionsRoot: Configuration.mainData.versionsRoot,
                        label: Configuration.mainData.versionLabel,
                        path: `${Configuration.mainData.versionLabel}/`
                    });
                } catch (err) {
                    logger.error(`Failed to update versions.json: ${(err as Error).message}`);
                    process.exit(1);
                }
            }

            logger.info(
                'Documentation generated in ' +
                    Configuration.mainData.output +
                    ' in ' +
                    this.callbacks.getElapsedTime() +
                    ' seconds using ' +
                    Configuration.mainData.theme +
                    ' theme'
            );
            if (Configuration.mainData.serve) {
                logger.info(
                    `Serving documentation from ${Configuration.mainData.output} at http://${Configuration.mainData.hostname}:${Configuration.mainData.port}`
                );
                this.callbacks.onServe(Configuration.mainData.output);
            } else {
                resolveGenerationPromise(true);
                this.callbacks.onDone();
            }
        };

        let finalOutput = Configuration.mainData.output;

        const testOutputDir = Configuration.mainData.output.match(cwd);

        if (testOutputDir && testOutputDir.length > 0) {
            finalOutput = Configuration.mainData.output.replace(cwd + path.sep, '');
        }

        fs.copy(
            path.resolve(`${__dirname}/../src/resources/`),
            path.resolve(finalOutput),
            errorCopy => {
                if (errorCopy) {
                    logger.error('Error during resources copy ', errorCopy);
                } else {
                    const extThemePromise = new Promise((extThemeResolve, extThemeReject) => {
                        if (Configuration.mainData.customThemePath) {
                            fs.copy(
                                Configuration.mainData.customThemePath,
                                path.resolve(`${finalOutput}/styles/custom.css`),
                                errorCopyTheme => {
                                    if (errorCopyTheme) {
                                        logger.error(
                                            'Error during custom theme copy ',
                                            errorCopyTheme
                                        );
                                        extThemeReject();
                                    } else {
                                        logger.info('Custom theme copy succeeded');
                                        extThemeResolve(true);
                                    }
                                }
                            );
                        } else if (Configuration.mainData.extTheme) {
                            fs.copy(
                                path.resolve(cwd + path.sep + Configuration.mainData.extTheme),
                                path.resolve(`${finalOutput}/styles/`),
                                errorCopyTheme => {
                                    if (errorCopyTheme) {
                                        logger.error(
                                            'Error during external styling theme copy ',
                                            errorCopyTheme
                                        );
                                        extThemeReject();
                                    } else {
                                        logger.info('External styling theme copy succeeded');
                                        extThemeResolve(true);
                                    }
                                }
                            );
                        } else {
                            extThemeResolve(true);
                        }
                    });

                    const customFaviconPromise = new Promise(
                        (customFaviconResolve, customFaviconReject) => {
                            if (Configuration.mainData.customFavicon !== '') {
                                logger.info(`Custom favicon supplied`);
                                fs.copy(
                                    path.resolve(
                                        cwd + path.sep + Configuration.mainData.customFavicon
                                    ),
                                    path.resolve(`${finalOutput}/images/favicon.ico`),
                                    errorCopyFavicon => {
                                        // tslint:disable-line
                                        if (errorCopyFavicon) {
                                            logger.error(
                                                'Error during resources copy of favicon',
                                                errorCopyFavicon
                                            );
                                            customFaviconReject();
                                        } else {
                                            logger.info('External custom favicon copy succeeded');
                                            customFaviconResolve(true);
                                        }
                                    }
                                );
                            } else {
                                customFaviconResolve(true);
                            }
                        }
                    );

                    const customLogoPromise = new Promise((customLogoResolve, customLogoReject) => {
                        if (Configuration.mainData.customLogo !== '') {
                            logger.info(`Custom logo supplied`);
                            fs.copy(
                                path.resolve(cwd + path.sep + Configuration.mainData.customLogo),
                                path.resolve(
                                    finalOutput +
                                        '/images/' +
                                        Configuration.mainData.customLogo.split('/').pop()
                                ),
                                errorCopyLogo => {
                                    // tslint:disable-line
                                    if (errorCopyLogo) {
                                        logger.error(
                                            'Error during resources copy of logo',
                                            errorCopyLogo
                                        );
                                        customLogoReject();
                                    } else {
                                        logger.info('External custom logo copy succeeded');
                                        customLogoResolve(true);
                                    }
                                }
                            );
                        } else {
                            customLogoResolve(true);
                        }
                    });

                    Promise.all([extThemePromise, customFaviconPromise, customLogoPromise]).then(
                        () => {
                            onComplete();
                        }
                    );
                }
            }
        );
    }
}
