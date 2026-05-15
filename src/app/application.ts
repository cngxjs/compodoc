import * as crypto from 'node:crypto';
import * as path from 'node:path';
import * as fs from 'fs-extra';
import traverse from 'neotraverse/legacy';

import AngularVersionUtil from '../utils/angular-version.util';
import { COMPODOC_DEFAULTS } from '../utils/defaults';
import { buildEntityIndex } from '../utils/entity-index.util';
import { logger } from '../utils/logger';
import { promiseSequential } from '../utils/promise-sequential';
import RouterParserUtil from '../utils/router-parser.util';
import {
    cleanNameWithoutSpaceAndToLowerCase,
    cleanSourcesForWatch,
    findMainSourceFolder
} from '../utils/utils';
import Configuration from './configuration';
import DependenciesEngine from './engines/dependencies.engine';
import ExportEngine from './engines/export.engine';
import FileEngine from './engines/file.engine';
import HtmlEngine from './engines/html.engine';
import I18nEngine from './engines/i18n.engine';
import MarkdownEngine, { type markdownReadedDatas } from './engines/markdown.engine';
import NgdEngine from './engines/ngd.engine';
import { runPagefindIndex } from './engines/search-indexer.engine';
import { type FileRefBundle, type FsReader, readFileRef } from './engines/stackblitz';
import { initHighlighter } from './engines/syntax-highlight.engine';
import { updateVersionsManifest } from './engines/versions-manifest.engine';
import type { AdditionalNode } from './interfaces/additional-node.interface';
import type { CoverageData } from './interfaces/coverageData.interface';
import {
    ClassPageGenerator,
    ComponentPageGenerator,
    DirectivePageGenerator,
    EntityPageGenerator,
    GuardPageGenerator,
    InjectablePageGenerator,
    InterceptorPageGenerator,
    InterfacePageGenerator,
    ModulePageGenerator,
    NavTabsResolver,
    PipePageGenerator
} from './page-generator';
import {
    type CoverageFile,
    computeDocumentationCoverage,
    computeUnitTestCoverage
} from './services/coverage';
import { crawlDependencies, crawlMicroDependencies } from './services/dependencies';
import { startWebServer } from './services/serve';

const cwd = process.cwd();
let startTime = new Date();
let generationPromiseResolve;
let generationPromiseReject;
const generationPromise = new Promise((resolve, reject) => {
    generationPromiseResolve = resolve;
    generationPromiseReject = reject;
});

export class Application {
    /**
     * Files processed during initial scanning
     */
    public files: Array<string>;
    /**
     * Files processed during watch scanning
     */
    public updatedFiles: Array<string>;
    /**
     * Files changed during watch scanning
     */
    public watchChangedFiles: Array<string> = [];
    /**
     * Boolean for watching status
     * @type {boolean}
     */
    public isWatching: boolean = false;

    private readonly navTabs: NavTabsResolver;
    private readonly pipePageGenerator: PipePageGenerator;
    private readonly classPageGenerator: ClassPageGenerator;
    private readonly interfacePageGenerator: InterfacePageGenerator;
    private readonly entityPageGenerator: EntityPageGenerator;
    private readonly directivePageGenerator: DirectivePageGenerator;
    private readonly injectablePageGenerator: InjectablePageGenerator;
    private readonly interceptorPageGenerator: InterceptorPageGenerator;
    private readonly guardPageGenerator: GuardPageGenerator;
    private readonly componentPageGenerator: ComponentPageGenerator;
    private readonly modulePageGenerator: ModulePageGenerator;

    /**
     * Create a new compodocx application instance.
     *
     * @param options An object containing the options that should be used.
     */
    constructor(options?: Object) {
        for (const option in options) {
            if (typeof Configuration.mainData[option] !== 'undefined') {
                Configuration.mainData[option] = options[option];
            }
            // For documentationMainName, process it outside the loop, for handling conflict with pages name
            if (option === 'name') {
                Configuration.mainData.documentationMainName = options[option];
            }
            // For documentationMainName, process it outside the loop, for handling conflict with pages name
            if (option === 'silent') {
                logger.silent = false;
            }
        }

        this.navTabs = new NavTabsResolver();
        this.pipePageGenerator = new PipePageGenerator(this.navTabs);
        this.classPageGenerator = new ClassPageGenerator(this.navTabs);
        this.interfacePageGenerator = new InterfacePageGenerator(this.navTabs);
        this.entityPageGenerator = new EntityPageGenerator(this.navTabs);
        this.directivePageGenerator = new DirectivePageGenerator(this.navTabs);
        this.injectablePageGenerator = new InjectablePageGenerator(this.navTabs);
        this.interceptorPageGenerator = new InterceptorPageGenerator(this.navTabs);
        this.guardPageGenerator = new GuardPageGenerator(this.navTabs);
        this.componentPageGenerator = new ComponentPageGenerator(this.navTabs);
        this.modulePageGenerator = new ModulePageGenerator(this.navTabs);
    }

    /**
     * Start compodocx process
     */
    protected generate(): Promise<{}> {
        process.on('unhandledRejection', this.unhandledRejectionListener);
        process.on('uncaughtException', this.uncaughtExceptionListener);

        I18nEngine.init(Configuration.mainData.language);

        if (
            Configuration.mainData.output.charAt(Configuration.mainData.output.length - 1) !== '/'
        ) {
            Configuration.mainData.output += '/';
        }

        if (Configuration.mainData.exportFormat !== COMPODOC_DEFAULTS.exportFormat) {
            this.processPackageJson();
        } else {
            initHighlighter(Configuration.mainData.shikiTheme || undefined)
                .then(() => HtmlEngine.init(Configuration.mainData.templates))
                .then(() => this.processPackageJson());
        }
        return generationPromise;
    }

    private endCallback() {
        process.removeListener('unhandledRejection', this.unhandledRejectionListener);
        process.removeListener('uncaughtException', this.uncaughtExceptionListener);
    }

    private unhandledRejectionListener(err, p) {
        console.log('Unhandled Rejection at:', p, 'reason:', err);
        logger.error(
            'Sorry, but there was a problem during parsing or generation of the documentation. Please fill an issue on github. (https://github.com/cngxjs/compodocx/issues/new)'
        ); // tslint:disable-line
        process.exit(1);
    }

    private uncaughtExceptionListener(err) {
        logger.error(err);
        logger.error(
            'Sorry, but there was a problem during parsing or generation of the documentation. Please fill an issue on github. (https://github.com/cngxjs/compodocx/issues/new)'
        ); // tslint:disable-line
        process.exit(1);
    }

    /**
     * Start compodocx documentation coverage
     */
    protected testCoverage() {
        this.getDependenciesData();
    }

    /**
     * Store files for initial processing
     * @param  {Array<string>} files Files found during source folder and tsconfig scan
     */
    public setFiles(files: Array<string>) {
        this.files = files;
    }

    /**
     * Store files for watch processing
     * @param  {Array<string>} files Files found during source folder and tsconfig scan
     */
    public setUpdatedFiles(files: Array<string>) {
        this.updatedFiles = files;
    }

    /**
     * Return a boolean indicating presence of one TypeScript file in updatedFiles list
     * @return {boolean} Result of scan
     */
    public hasWatchedFilesTSFiles(): boolean {
        let result = false;

        this.updatedFiles.forEach(file => {
            if (path.extname(file) === '.ts') {
                result = true;
            }
        });

        return result;
    }

    /**
     * Return a boolean indicating presence of one root markdown files in updatedFiles list
     * @return {boolean} Result of scan
     */
    public hasWatchedFilesRootMarkdownFiles(): boolean {
        let result = false;

        this.updatedFiles.forEach(file => {
            if (path.extname(file) === '.md' && path.dirname(file) === cwd) {
                result = true;
            }
        });

        return result;
    }

    /**
     * Clear files for watch processing
     */
    public clearUpdatedFiles(): void {
        this.updatedFiles = [];
        this.watchChangedFiles = [];
    }

    private processPackageJson(): void {
        logger.info('Searching package.json file');
        FileEngine.get(`${cwd + path.sep}package.json`).then(
            packageData => {
                const parsedData = JSON.parse(packageData);
                this.packageJsonData = parsedData;
                if (
                    typeof parsedData.name !== 'undefined' &&
                    Configuration.mainData.documentationMainName === COMPODOC_DEFAULTS.title
                ) {
                    Configuration.mainData.documentationMainName = `${parsedData.name} documentation`;
                }
                if (typeof parsedData.description !== 'undefined') {
                    Configuration.mainData.documentationMainDescription = parsedData.description;
                }
                Configuration.mainData.angularVersion =
                    AngularVersionUtil.getAngularVersionOfProject(parsedData);

                // Detect zone.js in dependencies (if absent, app is zoneless)
                const allDeps = {
                    ...parsedData.dependencies,
                    ...parsedData.devDependencies
                };
                Configuration.mainData.hasZoneJs = 'zone.js' in allDeps;

                // Surface the runtime + peer dep tables to the StackBlitz
                // manifest builder so consumer-declared third-party libraries
                // (incl. user-authored ones) are auto-forwarded into
                // `@playground` projects with the right version.
                Configuration.mainData.workspacePackage = {
                    dependencies: parsedData.dependencies ?? {},
                    peerDependencies: parsedData.peerDependencies ?? {}
                };

                logger.info('package.json file found');

                if (!Configuration.mainData.disableDependencies) {
                    if (typeof parsedData.dependencies !== 'undefined') {
                        this.processPackageDependencies(parsedData.dependencies);
                    }
                    if (typeof parsedData.peerDependencies !== 'undefined') {
                        this.processPackagePeerDependencies(parsedData.peerDependencies);
                    }
                }

                if (!Configuration.mainData.disableProperties) {
                    const propertiesToCheck = [
                        'version',
                        'description',
                        'keywords',
                        'homepage',
                        'bugs',
                        'license',
                        'repository',
                        'author'
                    ];
                    let hasOneOfCheckedProperties = false;
                    propertiesToCheck.forEach(prop => {
                        if (prop in parsedData) {
                            hasOneOfCheckedProperties = true;
                            Configuration.mainData.packageProperties[prop] = parsedData[prop];
                        }
                    });
                    if (hasOneOfCheckedProperties) {
                        Configuration.addPage({
                            name: 'properties',
                            id: 'packageProperties',
                            context: 'package-properties',
                            depth: 0,
                            pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
                        });
                    }
                }

                this.processMarkdowns().then(
                    () => {
                        this.getDependenciesData();
                    },
                    errorMessage => {
                        logger.error(errorMessage);
                        process.exit(1);
                    }
                );
            },
            errorMessage => {
                logger.error(errorMessage);
                logger.error('Continuing without package.json file');
                this.processMarkdowns().then(
                    () => {
                        this.getDependenciesData();
                    },
                    errorMessage1 => {
                        logger.error(errorMessage1);
                        process.exit(1);
                    }
                );
            }
        );
    }

    private processPackagePeerDependencies(dependencies): void {
        logger.info('Processing package.json peerDependencies');
        Configuration.mainData.packagePeerDependencies = dependencies;
        if (!Configuration.hasPage('dependencies')) {
            Configuration.addPage({
                name: 'dependencies',
                id: 'packageDependencies',
                context: 'package-dependencies',
                depth: 0,
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });
        }
    }

    private processPackageDependencies(dependencies): void {
        logger.info('Processing package.json dependencies');
        Configuration.mainData.packageDependencies = dependencies;
        Configuration.addPage({
            name: 'dependencies',
            id: 'packageDependencies',
            context: 'package-dependencies',
            depth: 0,
            pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
        });
    }

    private processMarkdowns(): Promise<any> {
        logger.info(
            'Searching README.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE.md, TODO.md files'
        );

        return new Promise((resolve, _reject) => {
            let i = 0;
            const markdowns = ['readme', 'changelog', 'contributing', 'license', 'todo'];
            const numberOfMarkdowns = 5;
            const loop = () => {
                if (i < numberOfMarkdowns) {
                    MarkdownEngine.getTraditionalMarkdown(markdowns[i].toUpperCase())
                        .then((readmeData: markdownReadedDatas) => {
                            logger.info(`${markdowns[i].toUpperCase()}.md file found`);
                            if (markdowns[i] === 'readme') {
                                Configuration.mainData.readme = true;
                                // Always create index.html as main page with README content
                                Configuration.addPage({
                                    name: 'index',
                                    context: 'readme',
                                    id: 'index',
                                    markdown: readmeData.markdown,
                                    data: readmeData.rawData,
                                    depth: 0,
                                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
                                });

                                // If overview is not disabled, also create separate overview page
                                if (!Configuration.mainData.disableOverview) {
                                    Configuration.addPage({
                                        name: 'overview',
                                        context: 'overview',
                                        id: 'overview',
                                        depth: 0,
                                        pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
                                    });
                                }
                            } else {
                                // For other markdown files (changelog, contributing, etc.)
                                Configuration.addPage({
                                    name: markdowns[i],
                                    context: markdowns[i],
                                    id: markdowns[i],
                                    markdown: readmeData.markdown,
                                    data: readmeData.rawData,
                                    depth: 0,
                                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
                                });
                                Configuration.mainData.markdowns.push({
                                    name: markdowns[i],
                                    uppername: markdowns[i].toUpperCase(),
                                    depth: 0,
                                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
                                });
                            }
                            i++;
                            loop();
                        })
                        .catch(errorMessage => {
                            logger.warn(errorMessage);
                            logger.warn(`Continuing without ${markdowns[i].toUpperCase()}.md file`);
                            if (markdowns[i] === 'readme') {
                                if (!Configuration.mainData.disableOverview) {
                                    Configuration.addPage({
                                        name: 'index',
                                        id: 'index',
                                        context: 'overview',
                                        depth: 0,
                                        pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
                                    });
                                } else {
                                    // When README doesn't exist and overview is disabled,
                                    // generate overview page anyway but show warning
                                    logger.warn(
                                        'No README.md found and --disableOverview is enabled.'
                                    );
                                    logger.warn(
                                        'Generating overview page as landing page. Consider adding a README.md file.'
                                    );
                                    Configuration.addPage({
                                        name: 'index',
                                        id: 'index',
                                        context: 'overview',
                                        depth: 0,
                                        pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
                                    });
                                }
                            }
                            i++;
                            loop();
                        });
                } else {
                    resolve(true);
                }
            };
            loop();
        });
    }

    private rebuildRootMarkdowns(): void {
        logger.info(
            'Regenerating README.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE.md, TODO.md pages'
        );

        const actions = [];

        Configuration.resetRootMarkdownPages();

        actions.push(() => {
            return this.processMarkdowns();
        });

        promiseSequential(actions)
            .then(_res => {
                this.processPages();
                this.clearUpdatedFiles();
            })
            .catch(errorMessage => {
                logger.error(errorMessage);
            });
    }

    /**
     * Get dependency data for small group of updated files during watch process
     */
    private getMicroDependenciesData(): void {
        logger.info('Get diff dependencies data');

        Configuration.mainData.angularProject = true;

        const dependenciesData = crawlMicroDependencies(this.updatedFiles, {
            tsconfigDirectory: path.dirname(Configuration.mainData.tsconfig)
        });

        DependenciesEngine.update(dependenciesData);

        this.prepareJustAFewThings(dependenciesData);
    }

    /**
     * Rebuild external documentation during watch process
     */
    private rebuildExternalDocumentation(): void {
        logger.info('Rebuild external documentation');

        const actions = [];

        Configuration.resetAdditionalPages();

        if (Configuration.mainData.includes !== '') {
            actions.push(() => {
                return this.prepareExternalIncludes();
            });
        }

        promiseSequential(actions)
            .then(_res => {
                this.processPages();
                this.clearUpdatedFiles();
            })
            .catch(errorMessage => {
                logger.error(errorMessage);
            });
    }

    private getDependenciesData(): void {
        logger.info('Get dependencies data');

        Configuration.mainData.angularProject = true;

        const dependenciesData = crawlDependencies(this.files, {
            tsconfigDirectory: path.dirname(Configuration.mainData.tsconfig)
        });

        // Auto-detect groupBy if not explicitly set by user
        if (!Configuration.mainData.groupBy) {
            const hasModules = dependenciesData.modules && dependenciesData.modules.length > 0;
            Configuration.mainData.hasNgModules = hasModules;
            Configuration.mainData.groupBy = hasModules ? 'none' : 'folder';
        }

        DependenciesEngine.init(dependenciesData);

        // Inject category groupings for sidebar navigation (used by menu partial)
        Configuration.mainData.categorizedComponents = DependenciesEngine.categorizedComponents;
        Configuration.mainData.categorizedDirectives = DependenciesEngine.categorizedDirectives;
        Configuration.mainData.categorizedInjectables = DependenciesEngine.categorizedInjectables;
        Configuration.mainData.categorizedPipes = DependenciesEngine.categorizedPipes;
        Configuration.mainData.categorizedClasses = DependenciesEngine.categorizedClasses;
        Configuration.mainData.categorizedInterfaces = DependenciesEngine.categorizedInterfaces;
        Configuration.mainData.categorizedGuards = DependenciesEngine.categorizedGuards;
        Configuration.mainData.categorizedInterceptors = DependenciesEngine.categorizedInterceptors;
        Configuration.mainData.categorizedEntities = DependenciesEngine.categorizedEntities;
        Configuration.mainData.categorizedByFeature = DependenciesEngine.categorizedByFeature;

        Configuration.mainData.routesLength = RouterParserUtil.routesLength();

        this.printStatistics();

        this.prepareEverything();
    }

    private prepareJustAFewThings(diffCrawledData): void {
        const actions = [];

        Configuration.resetPages();

        if (!Configuration.mainData.disableRoutesGraph) {
            actions.push(() => this.prepareRoutes());
        }

        if (diffCrawledData.components.length > 0) {
            actions.push(() => this.componentPageGenerator.prepare());
        }
        if (diffCrawledData.entities.length > 0) {
            actions.push(() => this.entityPageGenerator.prepare());
        }
        if (diffCrawledData.modules.length > 0) {
            actions.push(() => this.modulePageGenerator.prepare());
        }

        if (diffCrawledData.directives.length > 0) {
            actions.push(() => this.directivePageGenerator.prepare());
        }

        if (diffCrawledData.injectables.length > 0) {
            actions.push(() => this.injectablePageGenerator.prepare());
        }

        if (diffCrawledData.interceptors.length > 0) {
            actions.push(() => this.interceptorPageGenerator.prepare());
        }

        if (diffCrawledData.guards.length > 0) {
            actions.push(() => this.guardPageGenerator.prepare());
        }

        if (diffCrawledData.pipes.length > 0) {
            actions.push(() => this.pipePageGenerator.prepare());
        }

        if (diffCrawledData.classes.length > 0) {
            actions.push(() => this.classPageGenerator.prepare());
        }

        if (diffCrawledData.interfaces.length > 0) {
            actions.push(() => this.interfacePageGenerator.prepare());
        }

        if (
            diffCrawledData.miscellaneous.variables.length > 0 ||
            diffCrawledData.miscellaneous.functions.length > 0 ||
            diffCrawledData.miscellaneous.typealiases.length > 0 ||
            diffCrawledData.miscellaneous.enumerations.length > 0
        ) {
            actions.push(() => this.prepareMiscellaneous());
        }

        if (!Configuration.mainData.disableCoverage) {
            actions.push(() => this.prepareCoverage());
        }

        // Resolve `@playground` file refs after every dependency kind has
        // been prepared (so `dependency.playgrounds` is fully populated) and
        // before page rendering reads `data.playgroundFiles`.
        actions.push(() => Promise.resolve(this.resolvePlaygroundFiles()));

        promiseSequential(actions)
            .then(_res => {
                if (Configuration.mainData.exportFormat !== COMPODOC_DEFAULTS.exportFormat) {
                    if (
                        COMPODOC_DEFAULTS.exportFormatsSupported.indexOf(
                            Configuration.mainData.exportFormat
                        ) > -1
                    ) {
                        logger.info(
                            `Generating documentation in export format ${Configuration.mainData.exportFormat}`
                        );
                        ExportEngine.export(
                            Configuration.mainData.output,
                            Configuration.mainData
                        ).then(() => {
                            generationPromiseResolve(true);
                            this.endCallback();
                            logger.info(
                                'Documentation generated in ' +
                                    Configuration.mainData.output +
                                    ' in ' +
                                    this.getElapsedTime() +
                                    ' seconds'
                            );
                            if (Configuration.mainData.serve) {
                                logger.info(
                                    `Serving documentation from ${Configuration.mainData.output} at http://${Configuration.mainData.hostname}:${Configuration.mainData.port}`
                                );
                                this.serveAndStartWatch(Configuration.mainData.output);
                            }
                        });
                    } else {
                        logger.warn(`Exported format not supported`);
                    }
                } else {
                    this.processGraphs();
                    this.clearUpdatedFiles();
                }
            })
            .catch(errorMessage => {
                logger.error(errorMessage);
            });
    }

    private printStatistics() {
        logger.info('-------------------');
        logger.info('Project statistics ');
        if (DependenciesEngine.modules.length > 0) {
            logger.info(`- files        : ${this.files.length}`);
        }
        if (DependenciesEngine.modules.length > 0) {
            logger.info(`- module       : ${DependenciesEngine.modules.length}`);
        }
        if (DependenciesEngine.components.length > 0) {
            logger.info(`- component    : ${DependenciesEngine.components.length}`);
        }
        if (DependenciesEngine.entities.length > 0) {
            logger.info(`- entity       : ${DependenciesEngine.entities.length}`);
        }
        if (DependenciesEngine.directives.length > 0) {
            logger.info(`- directive    : ${DependenciesEngine.directives.length}`);
        }
        if (DependenciesEngine.injectables.length > 0) {
            logger.info(`- injectable   : ${DependenciesEngine.injectables.length}`);
        }
        if (DependenciesEngine.interceptors.length > 0) {
            logger.info(`- injector     : ${DependenciesEngine.interceptors.length}`);
        }
        if (DependenciesEngine.guards.length > 0) {
            logger.info(`- guard        : ${DependenciesEngine.guards.length}`);
        }
        if (DependenciesEngine.pipes.length > 0) {
            logger.info(`- pipe         : ${DependenciesEngine.pipes.length}`);
        }
        if (DependenciesEngine.classes.length > 0) {
            logger.info(`- class        : ${DependenciesEngine.classes.length}`);
        }
        if (DependenciesEngine.interfaces.length > 0) {
            logger.info(`- interface    : ${DependenciesEngine.interfaces.length}`);
        }
        if (Configuration.mainData.routesLength > 0) {
            logger.info(`- route        : ${Configuration.mainData.routesLength}`);
        }
        if (DependenciesEngine.miscellaneous.typealiases.length > 0) {
            logger.info(`- type aliases : ${DependenciesEngine.miscellaneous.typealiases.length}`);
        }
        logger.info('-------------------');
    }

    private prepareEverything() {
        const actions = [];

        actions.push(() => {
            return this.componentPageGenerator.prepare();
        });
        actions.push(() => {
            return this.modulePageGenerator.prepare();
        });

        if (DependenciesEngine.directives.length > 0) {
            actions.push(() => {
                return this.directivePageGenerator.prepare();
            });
        }

        if (DependenciesEngine.entities.length > 0) {
            actions.push(() => {
                return this.entityPageGenerator.prepare();
            });
        }

        if (DependenciesEngine.injectables.length > 0) {
            actions.push(() => {
                return this.injectablePageGenerator.prepare();
            });
        }

        if (DependenciesEngine.interceptors.length > 0) {
            actions.push(() => {
                return this.interceptorPageGenerator.prepare();
            });
        }

        if (DependenciesEngine.guards.length > 0) {
            actions.push(() => {
                return this.guardPageGenerator.prepare();
            });
        }

        if (DependenciesEngine.routes && !Configuration.mainData.disableRoutesGraph) {
            actions.push(() => {
                return this.prepareRoutes();
            });
        }

        if (DependenciesEngine.pipes.length > 0) {
            actions.push(() => {
                return this.pipePageGenerator.prepare();
            });
        }

        if (DependenciesEngine.classes.length > 0) {
            actions.push(() => {
                return this.classPageGenerator.prepare();
            });
        }

        if (DependenciesEngine.interfaces.length > 0) {
            actions.push(() => {
                return this.interfacePageGenerator.prepare();
            });
        }

        if (
            DependenciesEngine.miscellaneous.variables.length > 0 ||
            DependenciesEngine.miscellaneous.functions.length > 0 ||
            DependenciesEngine.miscellaneous.typealiases.length > 0 ||
            DependenciesEngine.miscellaneous.enumerations.length > 0
        ) {
            actions.push(() => {
                return this.prepareMiscellaneous();
            });
        }

        if (!Configuration.mainData.disableCoverage) {
            actions.push(() => {
                return this.prepareCoverage();
            });
        }

        if (Configuration.mainData.unitTestCoverage !== '') {
            actions.push(() => {
                return this.prepareUnitTestCoverage();
            });
        }

        if (Configuration.mainData.includes !== '') {
            actions.push(() => {
                return this.prepareExternalIncludes();
            });
        }

        // Resolve `@playground` file refs after every prepare* step has
        // populated `Configuration.mainData.<kind>.playgrounds`.
        actions.push(() => Promise.resolve(this.resolvePlaygroundFiles()));

        promiseSequential(actions)
            .then(_res => {
                if (Configuration.mainData.exportFormat !== COMPODOC_DEFAULTS.exportFormat) {
                    if (
                        COMPODOC_DEFAULTS.exportFormatsSupported.indexOf(
                            Configuration.mainData.exportFormat
                        ) > -1
                    ) {
                        logger.info(
                            `Generating documentation in export format ${Configuration.mainData.exportFormat}`
                        );
                        ExportEngine.export(
                            Configuration.mainData.output,
                            Configuration.mainData
                        ).then(() => {
                            generationPromiseResolve(true);
                            this.endCallback();
                            logger.info(
                                'Documentation generated in ' +
                                    Configuration.mainData.output +
                                    ' in ' +
                                    this.getElapsedTime() +
                                    ' seconds'
                            );
                            if (Configuration.mainData.serve) {
                                logger.info(
                                    `Serving documentation from ${Configuration.mainData.output} at http://${Configuration.mainData.hostname}:${Configuration.mainData.port}`
                                );
                                this.serveAndStartWatch(Configuration.mainData.output);
                            }
                        });
                    } else {
                        logger.warn(`Exported format not supported`);
                    }
                } else {
                    this.processGraphs();
                }
            })
            .catch(errorMessage => {
                logger.error(errorMessage);
                process.exit(1);
            });
    }

    private getIncludedPathForFile(file) {
        return path.join(Configuration.mainData.includes, file);
    }

    private prepareExternalIncludes() {
        logger.info('Adding external markdown files');
        // Scan include folder for files detailed in summary.json
        // For each file, add to Configuration.mainData.additionalPages
        // Each file will be converted to html page, inside COMPODOC_DEFAULTS.additionalEntryPath
        return new Promise(resolve => {
            FileEngine.get(this.getIncludedPathForFile('summary.json')).then(
                summaryData => {
                    logger.info('Additional documentation: summary.json file found');

                    const parsedSummaryData = JSON.parse(summaryData);

                    const that = this;
                    let lastLevelOnePage;

                    traverse(parsedSummaryData).forEach(function () {
                        // tslint:disable-next-line:no-invalid-this
                        if (this.notRoot && typeof this.node === 'object') {
                            // tslint:disable-next-line:no-invalid-this
                            const rawPath = this.path;
                            // tslint:disable-next-line:no-invalid-this
                            const additionalNode: AdditionalNode = this.node;
                            const file = additionalNode.file;
                            const title = additionalNode.title;
                            let finalPath = Configuration.mainData.includesFolder;

                            const finalDepth = rawPath.filter(el => {
                                return !Number.isNaN(parseInt(String(el), 10));
                            });

                            if (typeof file !== 'undefined' && typeof title !== 'undefined') {
                                const url = cleanNameWithoutSpaceAndToLowerCase(title);

                                /**
                                 * Id created with title + file path hash, seems to be hypothetically unique here
                                 */
                                const id = crypto
                                    .createHash('sha512')
                                    .update(title + file)
                                    .digest('hex');

                                // tslint:disable-next-line:no-invalid-this
                                this.node.id = id;

                                let lastElementRootTree;
                                finalDepth.forEach(el => {
                                    let elementTree =
                                        typeof lastElementRootTree === 'undefined'
                                            ? parsedSummaryData
                                            : lastElementRootTree;
                                    if (typeof elementTree.children !== 'undefined') {
                                        elementTree = elementTree.children[el];
                                    } else {
                                        elementTree = elementTree[el];
                                    }
                                    finalPath +=
                                        '/' +
                                        cleanNameWithoutSpaceAndToLowerCase(elementTree.title);
                                    lastElementRootTree = elementTree;
                                });

                                finalPath = finalPath.replace(`/${url}`, '');
                                const markdownFile = MarkdownEngine.getTraditionalMarkdownSync(
                                    that.getIncludedPathForFile(file)
                                );

                                if (finalDepth.length > 5) {
                                    logger.error('Only 5 levels of depth are supported');
                                } else {
                                    const _page = {
                                        name: title,
                                        id: id,
                                        filename: url,
                                        context: 'additional-page',
                                        path: finalPath,
                                        additionalPage: markdownFile,
                                        depth: finalDepth.length,
                                        childrenLength: additionalNode.children
                                            ? additionalNode.children.length
                                            : 0,
                                        children: [],
                                        lastChild: false,
                                        pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                                    };
                                    if (finalDepth.length === 1) {
                                        lastLevelOnePage = _page;
                                    }
                                    if (finalDepth.length > 1) {
                                        // store all child pages of the last root level 1 page inside it
                                        lastLevelOnePage.children.push(_page);
                                    } else {
                                        Configuration.addAdditionalPage(_page);
                                    }
                                }
                            }
                        }
                    });

                    resolve(true);
                },
                () => {
                    resolve(true);
                }
            );
        });
    }

    public prepareMiscellaneous(someMisc?) {
        // Generate app-config page if ApplicationConfig found
        Configuration.mainData.appConfig = DependenciesEngine.appConfig;
        if (Configuration.mainData.appConfig?.length > 0) {
            Configuration.addPage({
                name: 'app-config',
                id: 'app-config',
                context: 'app-config',
                depth: 0,
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });
        }

        logger.info('Prepare miscellaneous');
        Configuration.mainData.miscellaneous = someMisc
            ? someMisc
            : DependenciesEngine.getMiscellaneous();

        return new Promise((resolve, _reject) => {
            if (Configuration.mainData.miscellaneous.functions.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'functions',
                    id: 'miscellaneous-functions',
                    context: 'miscellaneous-functions',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            if (Configuration.mainData.miscellaneous.variables.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'variables',
                    id: 'miscellaneous-variables',
                    context: 'miscellaneous-variables',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            if (Configuration.mainData.miscellaneous.typealiases.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'typealiases',
                    id: 'miscellaneous-typealiases',
                    context: 'miscellaneous-typealiases',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }
            if (Configuration.mainData.miscellaneous.enumerations.length > 0) {
                Configuration.addPage({
                    path: 'miscellaneous',
                    name: 'enumerations',
                    id: 'miscellaneous-enumerations',
                    context: 'miscellaneous-enumerations',
                    depth: 1,
                    pageType: COMPODOC_DEFAULTS.PAGE_TYPES.INTERNAL
                });
            }

            resolve(true);
        });
    }

    public prepareRoutes(): Promise<void> {
        logger.info('Process routes');
        Configuration.mainData.routes = DependenciesEngine.getRoutes();

        return new Promise((resolve, reject) => {
            Configuration.addPage({
                name: 'routes',
                id: 'routes',
                context: 'routes',
                depth: 0,
                pageType: COMPODOC_DEFAULTS.PAGE_TYPES.ROOT
            });

            if (Configuration.mainData.exportFormat === COMPODOC_DEFAULTS.exportFormat) {
                RouterParserUtil.generateRoutesIndex(
                    Configuration.mainData.output,
                    Configuration.mainData.routes
                ).then(
                    () => {
                        logger.info(' Routes index generated');
                        resolve();
                    },
                    e => {
                        logger.error(e);
                        reject();
                    }
                );
            } else {
                resolve();
            }
        });
    }

    public prepareCoverage() {
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
                    generationPromiseResolve(true);
                    process.exit(0);
                } else {
                    const message = `Documentation coverage (${coverageData.count}%) is not over threshold (${Configuration.mainData.coverageTestThreshold}%)`;
                    generationPromiseReject();
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
                    generationPromiseReject();
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
                    generationPromiseResolve(true);
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
                    generationPromiseResolve(true);
                    process.exit(0);
                } else if (
                    coverageData.count >= Configuration.mainData.coverageTestThreshold &&
                    coverageTestPerFileResults.underFiles.length > 0
                ) {
                    logger.info(
                        `Documentation coverage (${coverageData.count}%) is over threshold (${Configuration.mainData.coverageTestThreshold}%)`
                    );
                    const message = `Documentation coverage per file is not over threshold (${Configuration.mainData.coverageMinimumPerFile}%)`;
                    generationPromiseReject();
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
                    generationPromiseReject();
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
                    generationPromiseReject();
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

    /**
     * Walk every entity kind that may carry `@playground fileRef` blocks
     * (components/directives/injectables/etc) and resolve each fileRef into
     * a `FileRefBundle` keyed by `${entityName}:${blockIndex}`. Read failures
     * surface as `logger.warn` and skip that block — the manifest builder
     * then falls back to its "Project assembly failed" path. Inline-only
     * playgrounds never enter this loop.
     */
    public resolvePlaygroundFiles(): void {
        const fsReader: FsReader = {
            readFile: (p: string): string | null => {
                try {
                    return fs.readFileSync(p, 'utf8');
                } catch {
                    return null;
                }
            },
            exists: (p: string): boolean => {
                try {
                    return fs.existsSync(p);
                } catch {
                    return false;
                }
            }
        };

        const out: Record<string, FileRefBundle> = {};
        const entitySources = [
            Configuration.mainData.components,
            Configuration.mainData.directives,
            Configuration.mainData.injectables,
            Configuration.mainData.guards,
            Configuration.mainData.interceptors,
            Configuration.mainData.pipes,
            Configuration.mainData.classes,
            Configuration.mainData.interfaces,
            Configuration.mainData.entities
        ];

        for (const list of entitySources) {
            if (!Array.isArray(list)) {
                continue;
            }
            for (const entity of list) {
                const playgrounds = entity?.playgrounds as
                    | Array<{ title?: string; fileRef?: string }>
                    | undefined;
                if (!playgrounds || playgrounds.length === 0) {
                    continue;
                }
                for (let i = 0; i < playgrounds.length; i++) {
                    const block = playgrounds[i];
                    if (!block?.fileRef) {
                        continue;
                    }
                    const hostFile = entity.file;
                    if (typeof hostFile !== 'string' || hostFile.length === 0) {
                        logger.warn(
                            `Playground "${block.title ?? '<untitled>'}" on ${entity.name}: missing host file path`
                        );
                        continue;
                    }
                    const result = readFileRef(block.fileRef, hostFile, fsReader);
                    if (!result.ok) {
                        logger.warn(
                            `Playground "${block.title ?? '<untitled>'}" on ${entity.name}: ${result.error}`
                        );
                        continue;
                    }
                    out[`${entity.name}:${i}`] = result.value;
                }
            }
        }

        Configuration.mainData.playgroundFiles = out;
    }

    public prepareUnitTestCoverage() {
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

    private processPage(page): Promise<void> {
        logger.info('Process page', page.name);

        const htmlData = HtmlEngine.render(Configuration.mainData, page);
        let finalPath = Configuration.mainData.output;

        if (Configuration.mainData.output.lastIndexOf('/') === -1) {
            finalPath += '/';
        }
        if (page.path) {
            finalPath += `${page.path}/`;
        }

        if (page.filename) {
            finalPath += `${page.filename}.html`;
        } else {
            finalPath += `${page.name}.html`;
        }

        FileEngine.writeSync(finalPath, htmlData);
        return Promise.resolve();
    }
    /**
     * Build the standalone component dependency graph from all components
     * that have standalone: true and imports.
     */
    private buildDependencyGraph() {
        const components = (Configuration.mainData.components as any[]) ?? [];
        const directives = (Configuration.mainData.directives as any[]) ?? [];
        const pipes = (Configuration.mainData.pipes as any[]) ?? [];
        const modules = (Configuration.mainData.modules as any[]) ?? [];
        const injectables = (Configuration.mainData.injectables as any[]) ?? [];

        // Build a name→type+url lookup for all known entities
        const entityMap = new Map<string, { type: string; url?: string }>();
        for (const c of components) {
            entityMap.set(c.name, { type: 'component', url: `./components/${c.name}.html` });
        }
        for (const d of directives) {
            entityMap.set(d.name, { type: 'directive', url: `./directives/${d.name}.html` });
        }
        for (const p of pipes) {
            entityMap.set(p.name, { type: 'pipe', url: `./pipes/${p.name}.html` });
        }
        for (const m of modules) {
            entityMap.set(m.name, { type: 'module', url: `./modules/${m.name}.html` });
        }
        for (const s of injectables) {
            entityMap.set(s.name, { type: 'injectable', url: `./injectables/${s.name}.html` });
        }

        const nodeSet = new Set<string>();
        const edges: Array<{ source: string; target: string }> = [];

        for (const comp of components) {
            if (!comp.standalone || !comp.imports?.length) {
                continue;
            }
            nodeSet.add(comp.name);
            for (const imp of comp.imports) {
                const impName = typeof imp === 'string' ? imp : imp.name;
                if (!impName) {
                    continue;
                }
                nodeSet.add(impName);
                edges.push({ source: comp.name, target: impName });
            }
        }

        const nodes = Array.from(nodeSet).map(name => {
            const info = entityMap.get(name);
            return {
                name,
                type: info?.type ?? 'module',
                url: info?.url
            };
        });

        Configuration.mainData.dependencyGraph = { nodes, edges };
    }

    private buildEntityIndex() {
        const index = buildEntityIndex(
            Configuration.mainData as unknown as Record<string, unknown>
        );
        Configuration.mainData.entityIndex = index;
    }

    public processPages() {
        this.buildDependencyGraph();
        this.buildEntityIndex();
        Configuration.mainData.generatedAt = new Date().toISOString();
        const pages = [...Configuration.pages].sort((a, b) => a.name.localeCompare(b.name));

        logger.info('Process pages');
        Promise.all(pages.map(page => this.processPage(page)))
            .then(() => {
                const callbacksAfterGenerateSearchIndexJson = () => {
                    if (Configuration.mainData.additionalPages.length > 0) {
                        this.processAdditionalPages();
                    } else {
                        if (Configuration.mainData.assetsFolder !== '') {
                            this.processAssetsFolder();
                        }
                        this.processResources();
                    }
                };
                callbacksAfterGenerateSearchIndexJson();
            })
            .catch(e => {
                logger.error(e);
            });
    }

    public processAdditionalPages() {
        logger.info('Process additional pages');
        const pages = Configuration.mainData.additionalPages;
        Promise.all(
            pages.map(page => {
                if (page.children.length > 0) {
                    return Promise.all([
                        this.processPage(page),
                        ...page.children.map(childPage => this.processPage(childPage))
                    ]);
                } else {
                    return this.processPage(page);
                }
            })
        )
            .then(() => {
                if (Configuration.mainData.assetsFolder !== '') {
                    this.processAssetsFolder();
                }
                this.processResources();
            })
            .catch(e => {
                logger.error(e);
                return Promise.reject(e);
            });
    }

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

    public processResources() {
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
                    this.getElapsedTime() +
                    ' seconds using ' +
                    Configuration.mainData.theme +
                    ' theme'
            );
            if (Configuration.mainData.serve) {
                logger.info(
                    `Serving documentation from ${Configuration.mainData.output} at http://${Configuration.mainData.hostname}:${Configuration.mainData.port}`
                );
                this.serveAndStartWatch(Configuration.mainData.output);
            } else {
                generationPromiseResolve(true);
                this.endCallback();
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

    /**
     * Calculates the elapsed time since the program was started.
     *
     * @returns {number}
     */
    private getElapsedTime() {
        return (Date.now() - startTime.valueOf()) / 1000;
    }

    public processGraphs() {
        if (Configuration.mainData.disableGraph) {
            logger.info('Graph generation disabled');
            this.processPages();
        } else {
            logger.info('Process main graph');
            const modules = Configuration.mainData.modules;
            let i = 0;
            const len = modules.length;
            const loop = () => {
                if (i <= len - 1) {
                    logger.info('Process module graph ', modules[i].name);
                    let finalPath = Configuration.mainData.output;
                    if (Configuration.mainData.output.lastIndexOf('/') === -1) {
                        finalPath += '/';
                    }
                    finalPath += `modules/${modules[i].name}`;
                    const _rawModule = DependenciesEngine.getRawModule(modules[i].name);
                    if (
                        _rawModule.declarations.length > 0 ||
                        _rawModule.bootstrap.length > 0 ||
                        _rawModule.imports.length > 0 ||
                        _rawModule.exports.length > 0 ||
                        _rawModule.providers.length > 0
                    ) {
                        NgdEngine.renderGraph(
                            modules[i].file,
                            finalPath,
                            'f',
                            modules[i].name
                        ).then(
                            () => {
                                NgdEngine.readGraph(
                                    path.resolve(`${finalPath + path.sep}dependencies.svg`),
                                    modules[i].name
                                ).then(
                                    data => {
                                        modules[i].graph = data;
                                        i++;
                                        loop();
                                    },
                                    err => {
                                        logger.error('Error during graph read: ', err);
                                    }
                                );
                            },
                            errorMessage => {
                                logger.error(errorMessage);
                            }
                        );
                    } else {
                        i++;
                        loop();
                    }
                } else {
                    this.processPages();
                }
            };
            let finalMainGraphPath = Configuration.mainData.output;
            if (finalMainGraphPath.lastIndexOf('/') === -1) {
                finalMainGraphPath += '/';
            }
            finalMainGraphPath += 'graph';
            NgdEngine.init(path.resolve(finalMainGraphPath));

            NgdEngine.renderGraph(
                Configuration.mainData.tsconfig,
                path.resolve(finalMainGraphPath),
                'p'
            ).then(
                () => {
                    NgdEngine.readGraph(
                        path.resolve(`${finalMainGraphPath + path.sep}dependencies.svg`),
                        'Main graph'
                    ).then(
                        data => {
                            Configuration.mainData.mainGraph = data;
                            loop();
                        },
                        err => {
                            logger.error('Error during main graph reading : ', err);
                            Configuration.mainData.disableMainGraph = true;
                            loop();
                        }
                    );
                },
                err => {
                    logger.error(
                        'Ooops error during main graph generation, moving on next part with main graph disabled : ',
                        err
                    );
                    Configuration.mainData.disableMainGraph = true;
                    loop();
                }
            );
        }
    }

    public serveAndStartWatch(folder: string): void {
        if (!this.isWatching) {
            startWebServer(folder, {
                host: Configuration.mainData.host || 'localhost',
                port: Configuration.mainData.port,
                open: Configuration.mainData.open
            });
        }
        this.startWatchIfRequested();
    }

    private startWatchIfRequested(): void {
        if (Configuration.mainData.watch && !this.isWatching) {
            if (typeof this.files === 'undefined') {
                logger.error('No sources files available, please use -p flag');
                generationPromiseReject();
                process.exit(1);
            } else {
                this.runWatch();
            }
        } else if (Configuration.mainData.watch && this.isWatching) {
            const srcFolder = findMainSourceFolder(this.files);
            logger.info(`Already watching sources in ${srcFolder} folder`);
        }
    }

    public async runWatch() {
        let sources = [findMainSourceFolder(this.files)];
        let watcherReady = false;

        this.isWatching = true;

        logger.info(`Watching sources in ${findMainSourceFolder(this.files)} folder`);

        if (MarkdownEngine.hasRootMarkdowns()) {
            sources = sources.concat(MarkdownEngine.listRootMarkdowns());
        }

        if (Configuration.mainData.includes !== '') {
            sources = sources.concat(Configuration.mainData.includes);
        }

        // Check all elements of sources list exist
        sources = cleanSourcesForWatch(sources);

        const { default: chokidar } = await import('chokidar');
        const watcher = chokidar.watch(sources, {
            awaitWriteFinish: true,
            ignoreInitial: true,
            ignored: /(spec|\.d)\.ts/
        });
        let timerAddAndRemoveRef;
        let timerChangeRef;
        const runnerAddAndRemove = () => {
            startTime = new Date();
            this.generate();
        };
        const waiterAddAndRemove = () => {
            clearTimeout(timerAddAndRemoveRef);
            timerAddAndRemoveRef = setTimeout(runnerAddAndRemove, 1000);
        };
        const runnerChange = () => {
            startTime = new Date();
            this.setUpdatedFiles(this.watchChangedFiles);
            if (this.hasWatchedFilesTSFiles()) {
                this.getMicroDependenciesData();
            } else if (this.hasWatchedFilesRootMarkdownFiles()) {
                this.rebuildRootMarkdowns();
            } else {
                this.rebuildExternalDocumentation();
            }
        };
        const waiterChange = () => {
            clearTimeout(timerChangeRef);
            timerChangeRef = setTimeout(runnerChange, 1000);
        };

        watcher.on('ready', () => {
            if (!watcherReady) {
                watcherReady = true;
                watcher
                    .on('add', file => {
                        logger.debug(`File ${file} has been added`);
                        // Test extension, if ts
                        // rescan everything
                        if (path.extname(file) === '.ts') {
                            waiterAddAndRemove();
                        }
                    })
                    .on('change', file => {
                        logger.debug(`File ${file} has been changed`);
                        // Test extension, if ts
                        // rescan only file
                        if (
                            path.extname(file) === '.ts' ||
                            path.extname(file) === '.md' ||
                            path.extname(file) === '.json'
                        ) {
                            this.watchChangedFiles.push(path.join(cwd + path.sep + file));
                            waiterChange();
                        }
                    })
                    .on('unlink', file => {
                        logger.debug(`File ${file} has been removed`);
                        // Test extension, if ts
                        // rescan everything
                        if (path.extname(file) === '.ts') {
                            waiterAddAndRemove();
                        }
                    });
            }
        });
    }

    /**
     * Return the application / root component instance.
     */
    get application(): Application {
        return this;
    }

    get isCLI(): boolean {
        return false;
    }
}
